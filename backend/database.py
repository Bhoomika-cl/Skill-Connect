import os

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb://localhost:27017"
)

client = MongoClient(MONGODB_URI)

db = client[os.getenv("DATABASE_NAME", "skillconnect")]

users_collection = db["users"]
profiles_collection = db["profiles"]
skills_collection = db["skills"]
projects_collection = db["projects"]
sessions_collection = db["sessions"]
audit_collection = db["admin_audit_log"]
tasks_collection = db["tasks"]
certifications_collection = db["certifications"]
oauth_states_collection = db["oauth_states"]

# Non-unique indexes preserve all existing data while keeping common lookups fast.
users_collection.create_index("username")
users_collection.create_index("email")
sessions_collection.create_index("token_hash")
sessions_collection.create_index("expires_at", expireAfterSeconds=0)
skills_collection.create_index([("skill_name", 1), ("user_id", 1)])
projects_collection.create_index("user_id")
tasks_collection.create_index([("assignee_id", 1), ("updated_at", -1)])
certifications_collection.create_index([("user_id", 1), ("created_at", -1)])
oauth_states_collection.create_index("expires_at", expireAfterSeconds=0)
