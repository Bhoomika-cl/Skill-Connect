import os

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb://localhost:27017"
)

client = MongoClient(MONGODB_URI)

db = client["skillconnect"]

users_collection = db["users"]
profiles_collection = db["profiles"]
skills_collection = db["skills"]
projects_collection = db["projects"]