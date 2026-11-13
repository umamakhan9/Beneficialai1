import sqlite3
import hashlib
import json
from datetime import datetime

DB_FILE = "beneficial_health.db"

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Base Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    # Automatic migration: Add profile columns to existing users table if they don't exist
    columns_to_add = [
        ("dob", "TEXT DEFAULT ''"),
        ("gender", "TEXT DEFAULT ''"),
        ("height", "TEXT DEFAULT ''"),
        ("weight", "TEXT DEFAULT ''"),
        ("blood_group", "TEXT DEFAULT ''"),
        ("emergency_contact", "TEXT DEFAULT ''"),
        ("allergies", "TEXT DEFAULT ''"),
        ("conditions", "TEXT DEFAULT ''"),
        ("age", "INTEGER DEFAULT 25")
    ]

    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};")
        except sqlite3.OperationalError:
            # Column already exists
            pass

    # 2. User Medications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        dose TEXT NOT NULL,
        timing TEXT NOT NULL,
        meal_relation TEXT NOT NULL,
        taken_today INTEGER DEFAULT 0,
        purpose TEXT DEFAULT 'Daily Wellness',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # 3. User Vitals Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        bp_sys INTEGER NOT NULL,
        bp_dia INTEGER NOT NULL,
        glucose INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # 4. User Diagnostic Reports Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        report_type TEXT DEFAULT 'Laboratory Report',
        summary TEXT NOT NULL,
        tests_json TEXT NOT NULL,
        status TEXT DEFAULT 'Analyzed',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # 5. User Health Documents Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS health_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT DEFAULT '',
        filename TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    # 6. Activity Timeline Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        activity_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()

# ----------------- User Queries -----------------
def create_user(full_name: str, email: str, password: str):
    conn = get_connection()
    cursor = conn.cursor()
    pwd_hash = hash_password(password)
    now = datetime.utcnow().isoformat()
    try:
        cursor.execute(
            "INSERT INTO users (full_name, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (full_name, email.lower().strip(), pwd_hash, now)
        )
        user_id = cursor.lastrowid

        # Log initial registration activity
        cursor.execute(
            "INSERT INTO activities (user_id, activity_type, title, description, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, "account_created", "Account Created", "Personal health space activated on BENEFICIALai.", now)
        )

        conn.commit()
        return get_user_by_id(user_id)
    finally:
        conn.close()

def authenticate_user(email: str, password: str):
    conn = get_connection()
    cursor = conn.cursor()
    pwd_hash = hash_password(password)
    cursor.execute("SELECT * FROM users WHERE email = ? AND password_hash = ?", (email.lower().strip(), pwd_hash))
    user = cursor.fetchone()
    conn.close()
    if user:
        d = dict(user)
        d.pop("password_hash", None)
        return d
    return None

def get_user_by_id(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if user:
        d = dict(user)
        d.pop("password_hash", None)
        return d
    return None

def update_user_profile(user_id: int, full_name: str, dob: str, gender: str, height: str, weight: str, blood_group: str, emergency_contact: str, allergies: str, conditions: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE users SET 
        full_name = ?, dob = ?, gender = ?, height = ?, weight = ?,
        blood_group = ?, emergency_contact = ?, allergies = ?, conditions = ?
    WHERE id = ?
    """, (full_name, dob, gender, height, weight, blood_group, emergency_contact, allergies, conditions, user_id))
    
    now = datetime.utcnow().isoformat()
    cursor.execute(
        "INSERT INTO activities (user_id, activity_type, title, description, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, "profile_updated", "Health Profile Updated", "Updated personal metrics, allergies, and contact details.", now)
    )
    conn.commit()
    conn.close()
    return get_user_by_id(user_id)

# ----------------- Medication Queries -----------------
def get_user_medications(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medications WHERE user_id = ? ORDER BY id DESC", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def add_user_medication(user_id: int, name: str, dose: str, timing: str, meal_relation: str, purpose: str):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute(
        "INSERT INTO medications (user_id, name, dose, timing, meal_relation, taken_today, purpose, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
        (user_id, name, dose, timing, meal_relation, purpose, now)
    )
    med_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO activities (user_id, activity_type, title, description, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, "medication_added", "Prescription Added", f"Added {name} ({dose}) - scheduled {timing}.", now)
    )
    conn.commit()
    conn.close()
    return med_id

def toggle_medication_status(med_id: int, user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medications WHERE id = ? AND user_id = ?", (med_id, user_id))
    row = cursor.fetchone()
    if row:
        new_val = 0 if row["taken_today"] == 1 else 1
        cursor.execute("UPDATE medications SET taken_today = ? WHERE id = ? AND user_id = ?", (new_val, med_id, user_id))
        now = datetime.utcnow().isoformat()
        status_text = "Completed" if new_val == 1 else "Pending"
        cursor.execute(
            "INSERT INTO activities (user_id, activity_type, title, description, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, "medication_taken", "Medication Scheduled Status", f"Marked {row['name']} as {status_text}.", now)
        )
        conn.commit()
    conn.close()

def delete_user_medication(med_id: int, user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM medications WHERE id = ? AND user_id = ?", (med_id, user_id))
    row = cursor.fetchone()
    med_name = row["name"] if row else "Medication"
    cursor.execute("DELETE FROM medications WHERE id = ? AND user_id = ?", (med_id, user_id))
    now = datetime.utcnow().isoformat()
    cursor.execute(
        "INSERT INTO activities (user_id, activity_type, title, description, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, "medication_removed", "Medication Removed", f"Removed {med_name} from active regimen.", now)
    )
    conn.commit()
    conn.close()

# ----------------- Vitals Queries -----------------
def get_user_vitals(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vitals WHERE user_id = ? ORDER BY id DESC LIMIT 20", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def add_user_vital(user_id: int, date: str, bp_sys: int, bp_dia: int, glucose: int):
    conn = get_connection()
    cursor = conn.cursor()
    status = "Elevated" if (bp_sys >= 140 or glucose >= 160) else "Normal"
    now = datetime.utcnow().isoformat()
    cursor.execute(
        "INSERT INTO vitals (user_id, date, bp_sys, bp_dia, glucose, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (user_id, date, bp_sys, bp_dia, glucose, status, now)
    )
    cursor.execute(
        "INSERT INTO activities (user_id, activity_type, title, description, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, "vitals_recorded", "Vitals Recorded", f"BP: {bp_sys}/{bp_dia} mmHg, Fasting Glucose: {glucose} mg/dL ({status}).", now)
    )
    conn.commit()
    conn.close()
    return {"date": date, "bp_sys": bp_sys, "bp_dia": bp_dia, "glucose": glucose, "status": status}

# ----------------- Reports Queries -----------------
def get_user_reports(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports WHERE user_id = ? ORDER BY id DESC LIMIT 15", (user_id,))
    rows = []
    for r in cursor.fetchall():
        d = dict(r)
        d["tests"] = json.loads(d["tests_json"]) if d.get("tests_json") else []
        rows.append(d)
    conn.close()
    return rows

def save_user_report(user_id: int, filename: str, summary: str, tests: list, report_type: str = "Laboratory Report"):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute(
        "INSERT INTO reports (user_id, filename, report_type, summary, tests_json, status, created_at) VALUES (?, ?, ?, ?, ?, 'Analyzed', ?)",
        (user_id, filename, report_type, summary, json.dumps(tests), now)
    )
    cursor.execute(
        "INSERT INTO activities (user_id, activity_type, title, description, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, "report_analyzed", "Report Analyzed", f"Analyzed {filename} with Smart Report Analyzer.", now)
    )
    conn.commit()
    conn.close()

def delete_user_report(report_id: int, user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM reports WHERE id = ? AND user_id = ?", (report_id, user_id))
    conn.commit()
    conn.close()

# ----------------- Health Records (Documents) -----------------
def get_user_health_records(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM health_records WHERE user_id = ? ORDER BY id DESC", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def add_user_health_record(user_id: int, title: str, category: str, description: str, filename: str):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute(
        "INSERT INTO health_records (user_id, title, category, description, filename, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, title, category, description, filename, now)
    )
    rec_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO activities (user_id, activity_type, title, description, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, "record_saved", "Document Saved", f"Added {category}: {title} ({filename}).", now)
    )
    conn.commit()
    conn.close()
    return rec_id

def delete_user_health_record(record_id: int, user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM health_records WHERE id = ? AND user_id = ?", (record_id, user_id))
    conn.commit()
    conn.close()

# ----------------- Activity Timeline -----------------
def get_user_activities(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM activities WHERE user_id = ? ORDER BY id DESC LIMIT 25", (user_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

# ----------------- Account Data Deletion -----------------
def delete_all_user_data(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM medications WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM vitals WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM reports WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM health_records WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM activities WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
