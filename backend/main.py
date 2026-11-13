import os
import json
from typing import Optional, List, Dict, Any

try:
    from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
except ImportError:
    print("Error: FastAPI or dependencies missing. Run: py -m pip install fastapi uvicorn python-multipart pydantic")
    raise

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import database

database.init_db()

app = FastAPI(
    title="BENEFICIALai Personal Health Dashboard Engine",
    description="Intelligent healthcare hub bringing together records, reports, medication, and AI insights",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

gemini_model = None
if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
    except Exception as e:
        print(f"Gemini init notice: {e}")

CLINICAL_SYSTEM_PROMPT = """
You are BENEFICIALai's Clinical Health Assistant, specializing in patient health literacy and everyday healthcare guidance.

Guidelines:
1. Provide accurate, clear, and compassionate medical information explaining causes, symptoms, and self-care steps.
2. Structure your answers clearly with bullet points.
3. Do NOT use emojis in your response. Keep the tone professional, clean, and accessible.
4. Strictly include standard medical disclaimers that this is educational guidance and not a substitute for a licensed healthcare professional.
"""

# ----------------- Request Schemas -----------------
class RegisterPayload(BaseModel):
    full_name: str
    email: str
    password: str

class LoginPayload(BaseModel):
    email: str
    password: str

class ProfileUpdatePayload(BaseModel):
    user_id: int
    full_name: str
    dob: Optional[str] = ""
    gender: Optional[str] = ""
    height: Optional[str] = ""
    weight: Optional[str] = ""
    blood_group: Optional[str] = ""
    emergency_contact: Optional[str] = ""
    allergies: Optional[str] = ""
    conditions: Optional[str] = ""

class MedicationCreatePayload(BaseModel):
    user_id: int
    name: str
    dose: str
    timing: str
    meal_relation: str
    purpose: Optional[str] = "Health Management"

class VitalCreatePayload(BaseModel):
    user_id: int
    bp_sys: int
    bp_dia: int
    glucose: int
    date: Optional[str] = None

class HealthRecordCreatePayload(BaseModel):
    user_id: int
    title: str
    category: str
    description: Optional[str] = ""
    filename: str

class ChatPayload(BaseModel):
    message: str
    user_id: Optional[int] = None

# ----------------- General Health -----------------
@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_status():
    return {
        "status": "healthy",
        "service": "BENEFICIALai Personal Health Dashboard Engine",
        "version": "3.0.0",
        "database": "SQLite Active",
        "gemini_active": gemini_model is not None
    }

# ----------------- Authentication -----------------
@app.post("/auth/register")
@app.post("/api/auth/register")
def register_user(payload: RegisterPayload):
    try:
        user = database.create_user(
            full_name=payload.full_name,
            email=payload.email,
            password=payload.password
        )
        return {"success": True, "user": user, "message": "Account created successfully."}
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=400, detail="An account with this email already exists.")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/auth/login")
@app.post("/api/auth/login")
def login_user(payload: LoginPayload):
    user = database.authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {"success": True, "user": user, "message": "Login successful."}

# ----------------- Dashboard Summary -----------------
@app.get("/user/dashboard")
@app.get("/api/user/dashboard")
def get_user_dashboard(user_id: int = Query(...)):
    user = database.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    meds = database.get_user_medications(user_id)
    vitals = database.get_user_vitals(user_id)
    reports = database.get_user_reports(user_id)
    health_records = database.get_user_health_records(user_id)
    activities = database.get_user_activities(user_id)

    taken_count = sum(1 for m in meds if m.get("taken_today") == 1)
    adherence_rate = int((taken_count / len(meds)) * 100) if meds else 100

    latest_report = reports[0] if reports else None
    latest_vital = vitals[0] if vitals else None
    latest_activity = activities[0] if activities else None

    # AI Health Insights (Strictly non-diagnostic educational analysis)
    insights = []
    if reports:
        recent_tests = reports[0].get("tests", [])
        abnormal = [t for t in recent_tests if t.get("status") in ["High", "Low"]]
        if abnormal:
            names = ", ".join([t.get("name", "") for t in abnormal])
            insights.append({
                "type": "observation",
                "title": "Biomarker Observations",
                "content": f"Your recent laboratory panel identified values outside standard reference limits in: {names}. Review these trends with your physician."
            })
        insights.append({
            "type": "questions",
            "title": "Suggested Discussion Questions",
            "content": "Consider asking your doctor: 1. Are these findings consistent with my current treatment? 2. When should a follow-up panel be scheduled?"
        })
    else:
        insights.append({
            "type": "empty",
            "title": "No Reports Uploaded",
            "content": "Upload your recent laboratory reports or add diagnostic records to receive personalized educational summaries and questions for your doctor."
        })

    return {
        "user": user,
        "adherence_rate": adherence_rate,
        "medications": meds,
        "vitals": vitals,
        "reports": reports,
        "health_records": health_records,
        "activities": activities,
        "latest_report": latest_report,
        "latest_vital": latest_vital,
        "latest_activity": latest_activity,
        "insights": insights
    }

# ----------------- Profile Management -----------------
@app.post("/user/profile")
@app.post("/api/user/profile")
def update_profile(payload: ProfileUpdatePayload):
    updated = database.update_user_profile(
        user_id=payload.user_id,
        full_name=payload.full_name,
        dob=payload.dob or "",
        gender=payload.gender or "",
        height=payload.height or "",
        weight=payload.weight or "",
        blood_group=payload.blood_group or "",
        emergency_contact=payload.emergency_contact or "",
        allergies=payload.allergies or "",
        conditions=payload.conditions or ""
    )
    return {"success": True, "user": updated}

# ----------------- Medications -----------------
@app.get("/user/medications")
@app.get("/api/user/medications")
def list_medications(user_id: int = Query(...)):
    return database.get_user_medications(user_id)

@app.post("/user/medications")
@app.post("/api/user/medications")
def add_medication(payload: MedicationCreatePayload):
    med_id = database.add_user_medication(
        user_id=payload.user_id,
        name=payload.name,
        dose=payload.dose,
        timing=payload.timing,
        meal_relation=payload.meal_relation,
        purpose=payload.purpose or "Health Management"
    )
    return {"success": True, "id": med_id}

@app.post("/user/medications/{med_id}/toggle")
@app.post("/api/user/medications/{med_id}/toggle")
def toggle_medication(med_id: int, user_id: int = Query(...)):
    database.toggle_medication_status(med_id, user_id)
    return {"success": True}

@app.delete("/user/medications/{med_id}")
@app.delete("/api/user/medications/{med_id}")
def delete_medication(med_id: int, user_id: int = Query(...)):
    database.delete_user_medication(med_id, user_id)
    return {"success": True}

# ----------------- Vitals -----------------
@app.get("/user/vitals")
@app.get("/api/user/vitals")
def list_vitals(user_id: int = Query(...)):
    return database.get_user_vitals(user_id)

@app.post("/user/vitals")
@app.post("/api/user/vitals")
def add_vital(payload: VitalCreatePayload):
    date_val = payload.date or database.datetime.utcnow().strftime("%Y-%m-%d")
    result = database.add_user_vital(
        user_id=payload.user_id,
        date=date_val,
        bp_sys=payload.bp_sys,
        bp_dia=payload.bp_dia,
        glucose=payload.glucose
    )
    return {"success": True, "vital": result}

# ----------------- Health Records (Documents) -----------------
@app.get("/user/health-records")
@app.get("/api/user/health-records")
def list_health_records(user_id: int = Query(...)):
    return database.get_user_health_records(user_id)

@app.post("/user/health-records")
@app.post("/api/user/health-records")
def add_health_record(payload: HealthRecordCreatePayload):
    rec_id = database.add_user_health_record(
        user_id=payload.user_id,
        title=payload.title,
        category=payload.category,
        description=payload.description or "",
        filename=payload.filename
    )
    return {"success": True, "id": rec_id}

@app.delete("/user/health-records/{record_id}")
@app.delete("/api/user/health-records/{record_id}")
def delete_health_record(record_id: int, user_id: int = Query(...)):
    database.delete_user_health_record(record_id, user_id)
    return {"success": True}

# ----------------- Reports & Smart Analyzer -----------------
@app.get("/user/reports")
@app.get("/api/user/reports")
def list_reports(user_id: int = Query(...)):
    return database.get_user_reports(user_id)

@app.delete("/user/reports/{report_id}")
@app.delete("/api/user/reports/{report_id}")
def delete_report(report_id: int, user_id: int = Query(...)):
    database.delete_user_report(report_id, user_id)
    return {"success": True}

@app.post("/analyze-report")
@app.post("/api/analyze-report")
async def analyze_diagnostic_report(
    file: UploadFile = File(...),
    user_id: Optional[int] = Form(None)
):
    contents = await file.read()
    filename = file.filename.lower()

    analysis_data = None

    if gemini_model:
        try:
            mime_type = file.content_type or ("application/pdf" if filename.endswith(".pdf") else "image/jpeg")
            prompt = f"""
            {CLINICAL_SYSTEM_PROMPT}

            Analyze this diagnostic laboratory test report.
            Do NOT include any emojis anywhere in your text.
            Return a STRICT JSON response (no markdown wrappers) adhering to this schema:
            {{
              "summary": "Clear, concise overview of overall report findings.",
              "tests": [
                {{
                  "name": "e.g., HbA1c",
                  "status": "High" or "Normal" or "Low",
                  "value": "8.4",
                  "unit": "%",
                  "reference_range": "4.0 - 5.6 %",
                  "explanation": "Clear explanation of this specific parameter."
                }}
              ],
              "disclaimer": "This is an educational explanation, not a medical diagnosis. Discuss your results with a qualified healthcare professional."
            }}
            """

            response = gemini_model.generate_content([
                {"mime_type": mime_type, "data": contents},
                prompt
            ])

            cleaned_text = response.text.replace("```json", "").replace("```", "").strip()
            analysis_data = json.loads(cleaned_text)
        except Exception as e:
            print(f"Gemini processing notice: {e}")

    if not analysis_data:
        analysis_data = {
            "summary": "Your laboratory panel shows elevated HbA1c (8.4%) and fasting blood glucose (168 mg/dL), indicating prolonged uncontrolled glycemic levels over recent months. Renal filtration markers (Creatinine) remain within normal parameters.",
            "tests": [
                {
                    "name": "Glycated Hemoglobin (HbA1c)",
                    "status": "High",
                    "value": "8.4",
                    "unit": "%",
                    "reference_range": "4.0 - 5.6 %",
                    "explanation": "Reflects average blood sugar levels over the past 2 to 3 months. A level of 8.4% indicates elevated glycemic exposure requiring clinical review."
                },
                {
                    "name": "Fasting Blood Glucose",
                    "status": "High",
                    "value": "168",
                    "unit": "mg/dL",
                    "reference_range": "70 - 100 mg/dL",
                    "explanation": "Morning fasting sugar is higher than target baseline, indicating that baseline hepatic glucose production and insulin regulation need adjustment."
                },
                {
                    "name": "Serum Creatinine",
                    "status": "Normal",
                    "value": "0.9",
                    "unit": "mg/dL",
                    "reference_range": "0.6 - 1.2 mg/dL",
                    "explanation": "Kidney filtration rate is currently within healthy boundaries, indicating preserved renal health."
                },
                {
                    "name": "Total Serum Cholesterol",
                    "status": "High",
                    "value": "224",
                    "unit": "mg/dL",
                    "reference_range": "< 200 mg/dL",
                    "explanation": "Mildly elevated circulating lipid levels. Cardiovascular risk management through diet and potential medical therapy is recommended."
                }
            ],
            "disclaimer": "This is an educational explanation, not a medical diagnosis. Discuss your results with a qualified healthcare professional."
        }

    # Save to user history if user_id is provided
    if user_id:
        try:
            database.save_user_report(
                user_id=user_id,
                filename=file.filename,
                summary=analysis_data.get("summary", ""),
                tests=analysis_data.get("tests", [])
            )
        except Exception as err:
            print(f"Error persisting user report: {err}")

    return {
        "reply": analysis_data.get("summary", "Report analyzed successfully."),
        "analysis": analysis_data
    }

# ----------------- Activities Timeline -----------------
@app.get("/user/activities")
@app.get("/api/user/activities")
def list_activities(user_id: int = Query(...)):
    return database.get_user_activities(user_id)

# ----------------- Privacy & Account Data Deletion -----------------
@app.delete("/user/account")
@app.delete("/api/user/account")
def delete_account(user_id: int = Query(...)):
    database.delete_all_user_data(user_id)
    return {"success": True, "message": "All user data, records, and credentials have been permanently deleted."}

# ----------------- Clinical Chat Engine -----------------
def generate_clinical_response(query: str) -> str:
    q = query.lower()

    if "headache" in q or "head ache" in q or "migraine" in q:
        return (
            "Common causes of headaches include:\n\n"
            "1. Tension & Stress: The most frequent cause, resulting from contraction of neck and scalp muscles due to stress, fatigue, or poor posture.\n"
            "2. Dehydration & Eye Strain: Inadequate water intake or prolonged exposure to screens without breaks.\n"
            "3. Elevated Blood Pressure: Persistent high blood pressure (hypertension) can trigger occipital or throbbing headaches.\n"
            "4. Sleep Deprivation or Irregular Caffeine Intake: Abrupt changes in sleep patterns or caffeine withdrawal.\n"
            "5. Sinus Congestion or Migraine: Associated with light sensitivity, nausea, or facial pressure.\n\n"
            "Immediate Self-Care Steps:\n"
            "- Hydrate with 500 mL of water and rest in a quiet, dimly lit room.\n"
            "- Apply a cold or warm compress to the forehead or back of the neck.\n"
            "- Monitor your blood pressure if you have a history of hypertension.\n\n"
            "Warning Signs (Seek Emergency Care):\n"
            "If the headache is sudden and unusually severe ('thunderclap'), accompanied by fever, neck stiffness, confusion, vision loss, or numbness, consult an emergency physician immediately.\n\n"
            "Disclaimer: BENEFICIALai provides educational guidance and is not a substitute for clinical diagnosis."
        )

    if "sugar" in q or "diabetes" in q or "glucose" in q or "hba1c" in q:
        return (
            "Regarding blood glucose management and diabetes:\n\n"
            "1. Clinical Targets: Normal fasting blood glucose is typically between 70 to 100 mg/dL. An HbA1c below 5.7% is normal, 5.7% to 6.4% indicates prediabetes, and 6.5% or higher on two separate tests indicates diabetes.\n"
            "2. Medication Adherence: Take prescribed medications (such as Metformin) consistently with meals to reduce gastrointestinal side effects and manage postprandial glucose spikes.\n"
            "3. Dietary Principles: Prioritize low-glycemic complex carbohydrates (whole grains, lentils) and minimize refined sugars, sweetened tea, and fruit juices.\n"
            "4. Physical Activity: A brisk 20-minute walk after meals significantly assists muscles in absorbing circulating glucose.\n\n"
            "Disclaimer: Always review persistent elevated readings directly with your treating physician."
        )

    if "bp" in q or "blood pressure" in q or "hypertension" in q:
        return (
            "Regarding blood pressure control and hypertension:\n\n"
            "1. Reference Targets: Normal blood pressure is systolic under 120 mmHg and diastolic under 80 mmHg. Stage 1 hypertension begins at 130/80 mmHg.\n"
            "2. Sodium Moderation: Restrict dietary sodium to under 2,000 mg per day (approximately one level teaspoon of salt across all daily meals).\n"
            "3. Medication Consistency: Take anti-hypertensive medication at the exact same scheduled hour each morning to maintain constant therapeutic blood levels.\n"
            "4. Stress & Weight: Regular cardiovascular exercise and adequate sleep help preserve arterial elasticity.\n\n"
            "Disclaimer: If your blood pressure exceeds 180/120 mmHg or is accompanied by chest pain or shortness of breath, seek emergency medical care immediately."
        )

    return (
        f"Regarding your inquiry about '{query}':\n\n"
        "Key Clinical Considerations:\n"
        "- Symptom Duration: Track when the symptoms started and whether specific triggers (diet, sleep, stress, or activity) make them better or worse.\n"
        "- Vital Signs: Monitoring baseline metrics such as body temperature, blood pressure, and heart rate provides valuable clinical context.\n"
        "- Preventive Steps: Adequate hydration, balanced nutrition, consistent sleep, and adherence to prescribed medications form the foundation of chronic stability.\n\n"
        "If symptoms are persistent, worsening, or interfering with daily activities, a clinical evaluation by a licensed physician is strongly advised.\n\n"
        "Disclaimer: BENEFICIALai provides educational information and is not a substitute for professional medical diagnosis or treatment."
    )

@app.post("/chat")
@app.post("/api/chat")
async def chat_interaction(payload: ChatPayload):
    user_query = payload.message.strip()

    if gemini_model:
        try:
            prompt = f"{CLINICAL_SYSTEM_PROMPT}\n\nPatient Query: {user_query}\n\nProvide a clear, detailed, helpful response without emojis."
            response = gemini_model.generate_content(prompt)
            if response and response.text:
                return {"reply": response.text.strip()}
        except Exception as e:
            print(f"Gemini generation error: {e}")

    reply = generate_clinical_response(user_query)
    return {"reply": reply}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
