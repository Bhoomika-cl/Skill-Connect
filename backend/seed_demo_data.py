"""Seed an isolated, local SkillConnect demo database with fake records.

Run from the backend folder with `python seed_demo_data.py`. The script uses
`skillconnect_demo` regardless of DATABASE_NAME in .env and refuses remote
MongoDB URIs. It never deletes records. The first run creates demo data; later
runs stop rather than overwriting demo activity entered through the website.
"""

import os
import secrets
from datetime import datetime, timedelta
from urllib.parse import urlparse

from dotenv import load_dotenv


load_dotenv()
mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
mongo_host = (urlparse(mongo_uri).hostname or "").lower()
if mongo_host not in {"localhost", "127.0.0.1", "::1"}:
    raise SystemExit("For safety, demo seeding is allowed only on local MongoDB.")

DEMO_DATABASE = "skillconnect_demo"
os.environ["DATABASE_NAME"] = DEMO_DATABASE

import bcrypt
from bson import ObjectId

from database import (
    audit_collection,
    certifications_collection,
    db,
    profiles_collection,
    projects_collection,
    skills_collection,
    tasks_collection,
    users_collection,
)


DEMO_RECORD_KEY = "skillconnect_demo_seed_v1"


def main():
    db.command("ping")
    if db["demo_seed_metadata"].find_one({"_id": DEMO_RECORD_KEY}):
        raise SystemExit(
            f"{DEMO_DATABASE} already has demo data. Nothing was changed. "
            "Use the existing demo accounts to sign in."
        )

    password = secrets.token_urlsafe(15)

    now = datetime.utcnow()
    demo_users = [
        {"username": "demo_admin", "full_name": "Alex Morgan", "email": "alex.morgan@example.test", "role": "admin", "department": "People Operations", "job_title": "Organization Administrator", "bio": "Demo administrator who helps teams discover skills and coordinate work."},
        {"username": "demo_employee", "full_name": "Priya Shah", "email": "priya.shah@example.test", "role": "employee", "department": "Engineering", "job_title": "Software Engineer", "bio": "Builds reliable web services and internal tools."},
        {"username": "demo_employee2", "full_name": "Daniel Torres", "email": "daniel.torres@example.test", "role": "employee", "department": "Data & Analytics", "job_title": "Data Analyst", "bio": "Turns organization data into useful reporting and insights."},
        {"username": "demo_employee3", "full_name": "Aisha Patel", "email": "aisha.patel@example.test", "role": "employee", "department": "Product", "job_title": "Product Designer", "bio": "Designs accessible product experiences and works closely with engineering."},
    ]
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    for person in demo_users:
        person.update({"password": hashed_password, "is_active": True, "created_at": now, "demo_seed_key": DEMO_RECORD_KEY})
        person["_id"] = ObjectId()
        users_collection.insert_one(person)
        profiles_collection.insert_one({
            "user_id": person["_id"], "full_name": person["full_name"],
            "username": person["username"], "email": person["email"],
            "department": person["department"], "job_title": person["job_title"],
            "bio": person["bio"], "teams_link": "", "created_at": now,
            "updated_at": now, "demo_seed_key": DEMO_RECORD_KEY,
        })

    admin, priya, daniel, aisha = demo_users

    skill_data = [
        (priya, "Python", "Advanced", "Programming", 4),
        (priya, "FastAPI", "Intermediate", "Backend", 2),
        (priya, "MongoDB", "Intermediate", "Database", 2),
        (priya, "React", "Advanced", "Frontend", 3),
        (daniel, "Python", "Intermediate", "Programming", 3),
        (daniel, "SQL", "Advanced", "Data", 5),
        (daniel, "Power BI", "Advanced", "Analytics", 4),
        (aisha, "Figma", "Expert", "Design", 5),
        (aisha, "React", "Beginner", "Frontend", 1),
        (aisha, "Accessibility", "Advanced", "Design", 3),
    ]
    skills = []
    for person, name, proficiency, category, years in skill_data:
        skills.append({
            "user_id": person["_id"], "skill_name": name,
            "proficiency": proficiency, "category": category,
            "years_experience": years, "created_at": now,
            "demo_seed_key": DEMO_RECORD_KEY,
        })
    skills_collection.insert_many(skills)

    projects = [
        {"user": priya, "name": "Employee Portal", "description": "A self-service portal for employee profiles, skills, and assigned work.", "skills_used": ["React", "FastAPI", "MongoDB"]},
        {"user": daniel, "name": "Workforce Skills Report", "description": "A sample analytics report showing workforce skills and coverage.", "skills_used": ["Python", "SQL", "Power BI"]},
        {"user": aisha, "name": "Accessible Onboarding", "description": "A redesigned onboarding flow with accessibility improvements.", "skills_used": ["Figma", "Accessibility", "React"]},
    ]
    inserted_projects = []
    for project in projects:
        document = {
            "user_id": project["user"]["_id"], "project_name": project["name"],
            "description": project["description"], "skills_used": project["skills_used"],
            "created_at": now, "demo_seed_key": DEMO_RECORD_KEY,
        }
        document["_id"] = projects_collection.insert_one(document).inserted_id
        inserted_projects.append(document)

    tasks_collection.insert_many([
        {"title": "Add skills to your profile", "description": "Review the sample skills and update your profile details.", "assignee_id": priya["_id"], "assigned_by": admin["_id"], "project_name": "Employee Portal", "due_date": (now + timedelta(days=7)).date().isoformat(), "status": "in_progress", "created_at": now, "updated_at": now, "demo_seed_key": DEMO_RECORD_KEY},
        {"title": "Review skills report", "description": "Check the sample workforce report and share any missing data.", "assignee_id": daniel["_id"], "assigned_by": admin["_id"], "project_name": "Workforce Skills Report", "due_date": (now + timedelta(days=14)).date().isoformat(), "status": "todo", "created_at": now, "updated_at": now, "demo_seed_key": DEMO_RECORD_KEY},
        {"title": "Check onboarding accessibility", "description": "Review the onboarding flow against the accessibility checklist.", "assignee_id": aisha["_id"], "assigned_by": admin["_id"], "project_name": "Accessible Onboarding", "due_date": (now + timedelta(days=10)).date().isoformat(), "status": "done", "created_at": now, "updated_at": now, "demo_seed_key": DEMO_RECORD_KEY},
    ])

    certifications_collection.insert_many([
        {"user_id": priya["_id"], "name": "Python Developer Foundations", "issuer": "Demo Learning Institute", "issue_date": "2025-06-15", "expiration_date": "", "credential_id": "DEMO-PY-2048", "verification_url": "https://example.com/certificates/demo-python", "notes": "Fake demo record. Not a real credential.", "verification_status": "submitted", "proof": None, "created_at": now, "updated_at": now, "demo_seed_key": DEMO_RECORD_KEY},
        {"user_id": daniel["_id"], "name": "Data Analytics Essentials", "issuer": "Demo Learning Institute", "issue_date": "2024-11-02", "expiration_date": "", "credential_id": "DEMO-DA-1024", "verification_url": "https://example.com/certificates/demo-analytics", "notes": "Fake demo record. Not a real credential.", "verification_status": "verified", "reviewed_by": admin["_id"], "proof": None, "created_at": now, "updated_at": now, "demo_seed_key": DEMO_RECORD_KEY},
        {"user_id": aisha["_id"], "name": "Accessibility Design Basics", "issuer": "Demo Learning Institute", "issue_date": "2025-02-10", "expiration_date": "", "credential_id": "DEMO-UX-512", "verification_url": "", "notes": "Fake demo record for testing the review workflow.", "verification_status": "submitted", "proof": None, "created_at": now, "updated_at": now, "demo_seed_key": DEMO_RECORD_KEY},
    ])

    audit_collection.insert_one({
        "actor_id": admin["_id"], "actor_username": admin["username"],
        "action": "demo_data_seeded", "target_id": DEMO_RECORD_KEY,
        "created_at": now, "demo_seed_key": DEMO_RECORD_KEY,
    })
    db["demo_seed_metadata"].insert_one({
        "_id": DEMO_RECORD_KEY, "database": DEMO_DATABASE,
        "created_at": now,
        "usernames": [person["username"] for person in demo_users],
        "project_ids": [project["_id"] for project in inserted_projects],
    })

    print(f"Seeded fake data into local MongoDB database: {DEMO_DATABASE}")
    print("Admin sign-in username: demo_admin")
    print("Employee sign-in usernames: demo_employee, demo_employee2, demo_employee3")
    print(f"Shared demo-only password: {password}")
    print("No data was written to the regular skillconnect database.")


if __name__ == "__main__":
    main()
