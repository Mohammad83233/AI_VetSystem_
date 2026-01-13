from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from passlib.context import CryptContext
from typing import List, Optional
import joblib
import json
import numpy as np
import pandas as pd
from datetime import datetime

app = FastAPI(title="VetAI Professional Clinical System v2.5")

# 1. ALLOW FRONTEND COMMUNICATION (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. DATABASE CONNECTION
client = MongoClient("mongodb://localhost:27017/")
db = client["VetAI_System"]
users_col = db["users"]
tokens_col = db["tokens"]

# 3. SECURITY SETUP
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 4. LOAD AI BRAIN ARTIFACTS
BASE_PATH = "Brain_Files"
try:
    model = joblib.load(f"{BASE_PATH}/vet_ai_model.pkl")
    mlb = joblib.load(f"{BASE_PATH}/symptom_binarizer.pkl")
    le_animal = joblib.load(f"{BASE_PATH}/animal_encoder.pkl")
    le_disease = joblib.load(f"{BASE_PATH}/disease_encoder.pkl")
    scaler = joblib.load(f"{BASE_PATH}/vitals_scaler.pkl")
    with open(f"{BASE_PATH}/veterinary_knowledge.json", 'r') as f:
        vet_kb = json.load(f)
    print("✅ SUCCESS: 10,000-Row AI Brain Integrated.")
except Exception as e:
    print(f"❌ ERROR: AI Brain files missing: {e}")

# 5. DATA SCHEMAS
class UserAuth(BaseModel):
    fullName: str
    vetId: str
    password: str
    role: str # 'Doctor' or 'Staff'
    email: str

class UserLogin(BaseModel):
    vetId: str
    password: str

class TokenCreate(BaseModel):
    petName: str
    ownerName: str
    species: str
    breed: str
    age: int
    gender: str
    weight: float
    temp: float
    consultDate: str

class DiagnosisRequest(BaseModel):
    tokenId: str
    symptomsText: str
    answeredSymptoms: List[str] = []

# --- 6. AUTHENTICATION ROUTES ---

@app.post("/register")
async def register(user: UserAuth):
    if users_col.find_one({"vetId": user.vetId}):
        raise HTTPException(status_code=400, detail="ID already registered")
    hashed_pwd = pwd_context.hash(user.password)
    users_col.insert_one({**user.dict(), "password": hashed_pwd})
    return {"message": "Account created successfully"}

@app.post("/login")
async def login(user: UserLogin):
    db_user = users_col.find_one({"vetId": user.vetId})
    if not db_user or not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid Credentials")
    return {"name": db_user["fullName"], "role": db_user["role"]}

# --- 7. STAFF ROUTES: SEQUENTIAL TOKENING ---

@app.post("/issue-token")
async def issue_token(data: TokenCreate):
    count_today = tokens_col.count_documents({"consultDate": data.consultDate})
    if count_today >= 60:
        raise HTTPException(status_code=400, detail="Daily capacity reached (60/60).")
    
    # Continuous numbering starting from 1001 for each date
    new_id = str(1001 + count_today)
    
    token_doc = {
        **data.dict(),
        "tokenId": new_id,
        "status": "Waiting",
        "registeredAt": datetime.now()
    }
    tokens_col.insert_one(token_doc)
    return {"tokenId": new_id, "message": "Token generated successfully!"}

# --- 8. DOCTOR ROUTES: SEPARATED QUEUES & DIAGNOSIS ---

@app.get("/get-queue")
async def get_queue():
    try:
        # A. WAITING: Sorted by Token ID (First registered at top)
        waiting = list(tokens_col.find({"status": "Waiting"}, {"_id": 0}).sort("tokenId", 1))
        
        # B. COMPLETED: Sorted by finishedAt (First finished at top)
        completed = list(tokens_col.find({"status": "Completed"}, {"_id": 0}).sort("finishedAt", 1))
        
        return {
            "waiting": waiting,
            "completed": completed
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/diagnose")
async def diagnose(req: DiagnosisRequest):
    try:
        pet = tokens_col.find_one({"tokenId": req.tokenId})
        if not pet: raise HTTPException(status_code=404, detail="Token Expired")

        all_known_symptoms = mlb.classes_
        found_symptoms = [s for s in all_known_symptoms if s in req.symptomsText.lower()]
        
        if not found_symptoms:
            raise HTTPException(status_code=400, detail="Describe at least one clinical sign.")

        # Vitals scaling using DataFrame to match feature names
        vitals_df = pd.DataFrame([[float(pet['temp']), 100.0, float(pet['weight'])]], 
                                 columns=['Temp_Num', 'Heart_Rate', 'Weight'])
        vitals_scaled = scaler.transform(vitals_df)
        ani_enc = le_animal.transform([pet['species'].lower().strip()])[0]
        symp_bin = mlb.transform([found_symptoms])

        X = np.hstack(([ani_enc], vitals_scaled[0], symp_bin[0])).reshape(1, -1)

        probs = model.predict_proba(X)[0]
        top3_idx = np.argsort(probs)[-3:][::-1]
        
        predictions = []
        for idx in top3_idx:
            predictions.append({
                "disease": str(le_disease.classes_[idx]),
                "confidence": float(round(probs[idx] * 100, 2))
            })

        top_disease = predictions[0]['disease']
        kb_entry = next((i for i in vet_kb if i["Disease_Prediction"] == top_disease), None)
        
        follow_up = None
        next_sym_internal = None
        if kb_entry:
            typical = kb_entry['Final_Symptom_List']
            missing = [s for s in typical if s not in found_symptoms and s not in req.answeredSymptoms]
            if missing:
                next_sym_internal = str(missing[0])
                follow_up = f"Based on pattern analysis for {top_disease}, does the animal show signs of '{next_sym_internal}'?"

        return {
            "predictions": predictions,
            "follow_up_question": follow_up,
            "next_sym_internal": next_sym_internal
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/complete-session/{token_id}")
async def complete_session(token_id: str):
    # Update status and record completion time for chronological history
    result = tokens_col.update_one(
        {"tokenId": token_id}, 
        {"$set": {
            "status": "Completed",
            "finishedAt": datetime.now()
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Token ID not found")
    return {"message": "Consultation archived successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)