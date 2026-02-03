import os
import json
import joblib
import warnings
import numpy as np
import pandas as pd
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from passlib.context import CryptContext

# 0. SETUP
warnings.filterwarnings("ignore")
app = FastAPI(title="VetAI Clinical System v9.0 - Pure Math Logic")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. DATABASE
client = MongoClient("mongodb://localhost:27017/")
db = client["VetAI_System"]
users_col = db["users"]
tokens_col = db["tokens"]

# 2. SECURITY
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# 3. CLINICAL CONSTANTS
SPECIES_BASES = {
    "Dog": {"Weight": 25.0, "temp": 39.0, "hr": 110},
    "Cat": {"Weight": 5.0, "temp": 38.5, "hr": 140},
    "Cow": {"Weight": 600.0, "temp": 39.5, "hr": 80},
    "Horse": {"Weight": 500.0, "temp": 39.8, "hr": 75},
    "Pig": {"Weight": 110.0, "temp": 39.2, "hr": 90},
    "Rabbit": {"Weight": 1.5, "temp": 38.5, "hr": 160},
    "Sheep": {"Weight": 80.0, "temp": 39.4, "hr": 78},
    "Goat": {"Weight": 70.0, "temp": 39.5, "hr": 82}
}

# WEIGHT SETTINGS FOR CALCULATION
# First 4 symptoms = 0.05 weight each. Last 4 = 0.15 weight each.
# Total possible weight = 0.80
SYMPTOM_WEIGHT_VALUES = [0.05, 0.05, 0.05, 0.05, 0.15, 0.15, 0.15, 0.15]
TOTAL_POSSIBLE_WEIGHT = sum(SYMPTOM_WEIGHT_VALUES) # 0.80

# MATH TUNING
BASE_TRUST = 0.55  # AI score we keep regardless of evidence (55%)
GROWTH_ROOM = 0.45 # Score that must be earned via evidence (45%)

# 4. LOAD BRAIN
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
    print("✅ AI Brain Integrated: Mathematical Evidence Logic Active.")
except Exception as e:
    print(f"❌ CRITICAL ERROR: {e}")

# 5. DATA SCHEMAS
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

# 6. SIGNAL ENGINEERING
def engineer_clinical_signals(pet, combined_symptoms):
    spec = pet['species'].strip()
    base = SPECIES_BASES.get(spec, SPECIES_BASES["Dog"])
    f_sig = pet['temp'] - base['temp']
    h_sig = pet['heartRate'] - base['hr']
    sev = f_sig * np.log1p(pet['duration'])
    try: a_id = le_animal.transform([spec])[0]
    except: a_id = 0
    try: b_id = le_breed.transform([pet['breed'].strip()])[0]
    except: b_id = 0 
    
    gen = 1 if pet['gender'].lower() == 'female' else 0
    v_raw = np.array([[f_sig, h_sig, sev, pet['duration'], pet['weight'], pet['age']]])
    v_scaled = scaler.transform(v_raw)
    
    s_str = " ".join([s.replace(" ", "_").lower() for s in combined_symptoms])
    s_vec = tfidf.transform([s_str]).toarray()
    
    return np.hstack(([a_id, b_id, gen], v_scaled[0], s_vec[0])).reshape(1, -1)

# 7. AUTH & STAFF
@app.post("/register")
async def register(user: UserAuth):
    users_col.insert_one({**user.model_dump(), "password": pwd_context.hash(user.password)})
    return {"message": "Success"}

@app.post("/login")
async def login(user: UserLogin):
    u = users_col.find_one({"vetId": user.vetId})
    if not u or not pwd_context.verify(user.password, u["password"]):
        raise HTTPException(status_code=401, detail="Invalid")
    return {"name": u["fullName"], "role": u["role"]}

@app.post("/issue-token")
async def issue_token(data: TokenCreate):
    count = tokens_col.count_documents({"consultDate": data.consultDate})
    t_id = str(1001 + count)
    gen = "Female" if data.species == "Cow" else data.gender
    tokens_col.insert_one({**data.model_dump(), "gender": gen, "tokenId": t_id, "status": "Waiting", "registeredAt": datetime.now()})
    return {"tokenId": t_id}

@app.get("/get-queue")
async def get_queue():
    today = datetime.now().strftime("%Y-%m-%d")
    w = list(tokens_col.find({"status": "Waiting", "consultDate": today}, {"_id": 0}))
    c = list(tokens_col.find({"status": "Completed", "consultDate": today}, {"_id": 0}))
    return {"waiting": w, "completed": c}

# 8. DOCTOR MODULE (PURE MATH LOGIC)
@app.post("/diagnose")
async def diagnose(req: DiagnosisRequest):
    try:
        query = {"$or": [{"tokenId": req.tokenId}, {"tokenId": int(req.tokenId) if req.tokenId.isdigit() else -1}]}
        pet = tokens_col.find_one(query)
        if not pet: raise HTTPException(status_code=404, detail="Not Found")

        # A. Symptom Extraction
        vocab = sorted(tfidf.get_feature_names_out(), key=len, reverse=True)
        found = []
        txt = req.symptomsText.lower()
        
        typos = {"fomaing": "foaming", "shufle": "shuffling"} # Simple correction
        for k, v in typos.items(): txt = txt.replace(k, v)

        for s in vocab:
            phrase = s.replace("_", " ")
            if phrase in txt:
                found.append(phrase)
                txt = txt.replace(phrase, "---") 
        combined = list(set(found + req.answeredSymptoms))
        
        # B. Raw AI Prediction
        X = engineer_clinical_signals(pet, combined)
        probs = model.predict_proba(X)[0]
        top_idx = np.argsort(probs)[::-1][:3]
        
        # =============================================================
        # C. EVIDENCE MATHEMATICS (No If-Else Logic)
        # =============================================================
        math_scores = []
        
        for idx in top_idx:
            d_name = le_target.classes_[idx]
            raw_ai = float(probs[idx])
            
            # Lookup in Knowledge Base to check evidence
            kb = next((i for i in vet_kb if i["disease"] == d_name), None)
            
            if kb:
                typical = [s.lower() for s in kb['typical_symptoms']]
                confirmed = [s.lower() for s in combined]
                
                # 1. Calculate Earned Evidence (0.0 to 0.8)
                current_weight = 0.0
                for i in range(min(len(typical), 8)): # Ensure we don't go out of bounds
                    if typical[i] in confirmed:
                        current_weight += SYMPTOM_WEIGHT_VALUES[i]
                
                # 2. Calculate Ratio (0.0 to 1.0)
                evidence_ratio = current_weight / TOTAL_POSSIBLE_WEIGHT
                
                # 3. Apply The Formula
                # Formula: (RawAI * 0.55) + (RawAI * 0.45 * EvidenceRatio)
                # If evidence is low (0.1), result is ~59% of RawAI.
                # If evidence is high (1.0), result is 100% of RawAI.
                adjusted_score = (raw_ai * BASE_TRUST) + (raw_ai * GROWTH_ROOM * evidence_ratio)
                math_scores.append(adjusted_score)
            else:
                # If disease not in KB, heavy penalty
                math_scores.append(raw_ai * 0.2)

        # D. Normalize to 100% Sum
        total_score = sum(math_scores)
        if total_score == 0: total_score = 1
        
        final_pct = []
        for s in math_scores:
            val = (s / total_score) * 100
            final_pct.append(float(round(val, 2)))
            
        # Exact rounding fix
        final_pct[0] = float(round(final_pct[0] + (100.0 - sum(final_pct)), 2))

        predictions = [{"disease": str(le_target.classes_[i]), "confidence": final_pct[k]} for k, i in enumerate(top_idx)]

        # E. Loop Logic
        q, sugg = None, None
        top_d = predictions[0]['disease']
        kb_top = next((i for i in vet_kb if i["disease"] == top_d), None)
        
        if kb_top and len(combined) < 8:
            rem = [s for s in kb_top['typical_symptoms'] if s.lower() not in [c.lower() for c in combined]]
            if rem:
                sugg = rem[0]
                q = f"Based on {top_d}, does the animal show signs of '{sugg}'?"

        return {
            "predictions": predictions,
            "refinement": {
                "question": q, "symptom": sugg,
                "isComplete": len(combined) >= 8 or predictions[0]['confidence'] >= 94,
                "canFinalize": True, "currentSymptomCount": len(combined)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/finalize/{token_id}")
async def finalize(token_id: str):
    today = datetime.now().strftime("%Y-%m-%d")
    tokens_col.update_one({"consultDate": today, "tokenId": token_id}, {"$set": {"status": "Completed", "finishedAt": datetime.now()}})
    return {"message": "Success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)