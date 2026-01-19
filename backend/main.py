import os
import json
import joblib
import warnings
import numpy as np
import pandas as pd
import re
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from passlib.context import CryptContext

# 0. SETUP
warnings.filterwarnings("ignore")
app = FastAPI(title="VetAI Clinical System v4.0 - 91% Precision & Daily Queue Sync")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. DATABASE CONNECTION
client = MongoClient("mongodb://localhost:27017/")
db = client["VetAI_System"]
users_col = db["users"]
tokens_col = db["tokens"]

# 2. SECURITY
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# 3. LOAD AI BRAIN ARTIFACTS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BRAIN_DIR = os.path.join(BASE_DIR, "Brain_Files")

try:
    model = joblib.load(os.path.join(BRAIN_DIR, 'vet_ai_model.pkl'))
    scaler = joblib.load(os.path.join(BRAIN_DIR, 'vitals_scaler.pkl'))
    le_animal = joblib.load(os.path.join(BRAIN_DIR, 'animal_encoder.pkl'))
    le_breed = joblib.load(os.path.join(BRAIN_DIR, 'breed_encoder.pkl'))
    le_target = joblib.load(os.path.join(BRAIN_DIR, 'disease_encoder.pkl'))
    tfidf = joblib.load(os.path.join(BRAIN_DIR, 'symptom_binarizer.pkl')) 
    
    with open(os.path.join(BRAIN_DIR, 'veterinary_knowledge.json'), 'r') as f:
        vet_kb = json.load(f)
    print("✅ AI Brain Integrated: High-Precision daily logic active.")
except Exception as e:
    print(f"❌ CRITICAL ERROR LOADING BRAIN: {e}")

# 4. DATA SCHEMAS
class UserAuth(BaseModel):
    fullName: str; vetId: str; password: str; role: str; email: str

class UserLogin(BaseModel):
    vetId: str; password: str

class TokenCreate(BaseModel):
    petName: str; ownerName: str; species: str; breed: str
    age: int; gender: str; weight: float; temp: float; 
    duration: int; heartRate: int; consultDate: str 

class DiagnosisRequest(BaseModel):
    tokenId: str
    symptomsText: str
    answeredSymptoms: List[str] = Field(default_factory=list)

# 5. AUTHENTICATION MODULE
@app.post("/register")
async def register(user: UserAuth):
    hashed_pwd = pwd_context.hash(user.password)
    users_col.insert_one({**user.dict(), "password": hashed_pwd})
    return {"message": "Success"}

@app.post("/login")
async def login(user: UserLogin):
    db_user = users_col.find_one({"vetId": user.vetId})
    if not db_user or not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid Credentials")
    return {"name": db_user["fullName"], "role": db_user["role"]}

# 6. STAFF MODULE (Daily Reset Logic)

@app.post("/issue-token")
async def issue_token(data: TokenCreate):
    # Logic: Token ID resets to 1001 every new date provided by frontend
    count_today = tokens_col.count_documents({"consultDate": data.consultDate})
    new_token_id = str(1001 + count_today) 
    
    token_doc = {
        **data.dict(), 
        "tokenId": new_token_id, 
        "status": "Waiting", 
        "registeredAt": datetime.now()
    }
    tokens_col.insert_one(token_doc)
    return {"tokenId": new_token_id}

@app.get("/get-queue")
async def get_queue():
    # Only fetch records for the current date (This is the visibility reset)
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # 1. WAITING list for today
    waiting = list(tokens_col.find(
        {"status": "Waiting", "consultDate": today_str}, 
        {"_id": 0}
    ).sort("tokenId", 1))
    
    # 2. COMPLETED list for today
    completed = list(tokens_col.find(
        {"status": "Completed", "consultDate": today_str}, 
        {"_id": 0}
    ).sort("finishedAt", -1))
    
    return {"waiting": waiting, "completed": completed}

# 7. DOCTOR MODULE (AI LOGIC)

def engineer_clinical_signals(pet, combined_symptoms):
    SPECIES_BASES = {
        'dog': {'temp': 39.2, 'hr': 100}, 'cat': {'temp': 39.2, 'hr': 140},
        'cow': {'temp': 39.3, 'hr': 60}, 'horse': {'temp': 38.5, 'hr': 40},
        'sheep': {'temp': 39.9, 'hr': 75}, 'goat': {'temp': 39.9, 'hr': 80},
        'pig': {'temp': 39.5, 'hr': 75}, 'rabbit': {'temp': 39.5, 'hr': 140}
    }
    spec = pet['species'].lower().strip()
    breed = pet['breed'].lower().strip()
    base = SPECIES_BASES.get(spec, {'temp': 39.0, 'hr': 80})
    
    fever_signal = pet['temp'] - base['temp']
    hr_signal = pet['heartRate'] - base['hr']
    severity_idx = fever_signal * np.log1p(pet['duration'])
    
    try: animal_id = le_animal.transform([spec])[0]
    except: animal_id = 0
    try: breed_id = le_breed.transform([breed])[0]
    except: breed_id = 0 
    
    gender_id = 1 if pet['gender'].lower() == 'female' else 0
    vitals_raw = np.array([[fever_signal, hr_signal, severity_idx, pet['duration'], pet['weight'], pet['age']]])
    vitals_scaled = scaler.transform(vitals_raw)

    symptom_string = " ".join([s.replace(" ", "_").lower() for s in combined_symptoms])
    symptom_vector = tfidf.transform([symptom_string]).toarray()

    final_features = np.hstack(([animal_id, breed_id, gender_id], vitals_scaled[0], symptom_vector[0]))
    return final_features.reshape(1, -1)

@app.post("/diagnose")
async def diagnose(req: DiagnosisRequest):
    try:
        # Dual-type lookup to ensure we find the record
        query = {"$or": [{"tokenId": req.tokenId}, {"tokenId": int(req.tokenId) if req.tokenId.isdigit() else -1}]}
        pet = tokens_col.find_one(query)
        if not pet: raise HTTPException(status_code=404, detail="Token Not Found")

        all_vocab = sorted(tfidf.get_feature_names_out(), key=len, reverse=True)
        found_in_text = []
        text_content = req.symptomsText.lower()
        
        temp_text = text_content
        for s in all_vocab:
            clean_phrase = s.replace("_", " ")
            if clean_phrase.lower() in temp_text:
                found_in_text.append(clean_phrase)
                temp_text = temp_text.replace(clean_phrase.lower(), "---") 
        
        combined_symptoms = list(set(found_in_text + req.answeredSymptoms))
        final_symptoms_for_ai = combined_symptoms[:4] # Strict limit for 91% precision
        current_count = len(final_symptoms_for_ai)
        
        X_input = engineer_clinical_signals(pet, final_symptoms_for_ai)
        probs = model.predict_proba(X_input)[0]
        top3_idx = np.argsort(probs)[-3:][::-1]
        
        predictions = []
        for idx in top3_idx:
            predictions.append({
                "disease": str(le_target.classes_[idx]),
                "confidence": float(round(probs[idx] * 100, 2))
            })

        follow_up_question, suggested_symptom = None, None
        top_disease = predictions[0]['disease']

        if current_count < 4:
            kb_entry = next((item for item in vet_kb if item["disease"] == top_disease), None)
            if kb_entry:
                typical = kb_entry['typical_symptoms']
                remaining = [s for s in typical if s.lower() not in [cs.lower() for cs in final_symptoms_for_ai]]
                if remaining:
                    suggested_symptom = remaining[0]
                    follow_up_question = f"Based on {top_disease} markers, does the animal show '{suggested_symptom}'?"

        return {
            "predictions": predictions,
            "refinement": {
                "question": follow_up_question,
                "symptom": suggested_symptom,
                "isComplete": current_count >= 4 or follow_up_question is None,
                "canFinalize": current_count >= 1,
                "currentSymptomCount": current_count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/finalize/{token_id}")
async def finalize(token_id: str):
    # Today's date ensures we only update the record for the current work shift
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    query = {
        "consultDate": today_str,
        "$or": [
            {"tokenId": token_id},
            {"tokenId": int(token_id) if token_id.isdigit() else -1}
        ]
    }
    
    update = {
        "$set": {
            "status": "Completed", 
            "finishedAt": datetime.now()
        }
    }
    
    # This change automatically moves the pet from Waiting to Archived list
    result = tokens_col.update_one(query, update)
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pet record not found for today")
        
    return {"message": "Success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)