from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
import bcrypt
import re

from database import (
    users_collection,
    profiles_collection,
    skills_collection,
    projects_collection
)


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="SkillConnect API",
    description="Backend API for SkillConnect employee skill management platform",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "SkillConnect API is running successfully"
    }


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def serialize_document(document):
    if not document:
        return None

    document = dict(document)

    if "_id" in document:
        document["_id"] = str(document["_id"])

    if "user_id" in document:
        document["user_id"] = str(document["user_id"])

    if "created_at" in document:
        if isinstance(document["created_at"], datetime):
            document["created_at"] = document["created_at"].isoformat()

    if "updated_at" in document:
        if isinstance(document["updated_at"], datetime):
            document["updated_at"] = document["updated_at"].isoformat()

    return document


def get_object_id(value):
    try:
        return ObjectId(value)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid user ID"
        )


def normalize_skill_name(skill_name):
    return str(skill_name).strip().lower()


def get_skill_records_for_user(user_id):
    return list(
        skills_collection.find(
            {"user_id": user_id}
        )
    )


def get_projects_for_user(user_id):
    return list(
        projects_collection.find(
            {"user_id": user_id}
        )
    )


# ============================================================
# AUTHENTICATION MODELS
# ============================================================

class SignupRequest(BaseModel):
    full_name: str
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


# ============================================================
# SIGN UP
# ============================================================

@app.post("/api/auth/signup")
def signup(data: SignupRequest):

    email = data.email.strip().lower()

    if not re.match(
        r"^[A-Za-z0-9._%+-]+@cirruslabs\.io$",
        email
    ):
        raise HTTPException(
            status_code=400,
            detail="Only @cirruslabs.io email addresses are allowed"
        )

    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters"
        )

    existing_username = users_collection.find_one(
        {
            "username": data.username.strip()
        }
    )

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    existing_email = users_collection.find_one(
        {
            "email": email
        }
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    hashed_password = bcrypt.hashpw(
        data.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    user = {
        "full_name": data.full_name.strip(),
        "username": data.username.strip(),
        "email": email,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }

    result = users_collection.insert_one(user)

    user_id = str(result.inserted_id)

    profiles_collection.insert_one(
        {
            "user_id": result.inserted_id,
            "full_name": data.full_name.strip(),
            "email": email,
            "username": data.username.strip(),
            "department": "",
            "job_title": "",
            "bio": "",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    )

    return {
        "message": "Account created successfully",
        "user": {
            "id": user_id,
            "full_name": data.full_name.strip(),
            "username": data.username.strip(),
            "email": email
        }
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/api/auth/login")
def login(data: LoginRequest):

    user = users_collection.find_one(
        {
            "username": data.username.strip()
        }
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    stored_password = user.get(
        "password",
        ""
    )

    try:
        password_match = bcrypt.checkpw(
            data.password.encode("utf-8"),
            stored_password.encode("utf-8")
        )
    except Exception:
        password_match = False

    if not password_match:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    return {
        "message": "Login successful",
        "user": {
            "id": str(user["_id"]),
            "full_name": user.get(
                "full_name",
                ""
            ),
            "username": user.get(
                "username",
                ""
            ),
            "email": user.get(
                "email",
                ""
            )
        }
    }


# ============================================================
# DASHBOARD STATISTICS
# ============================================================

@app.get("/api/dashboard/stats")
def dashboard_stats():

    total_employees = users_collection.count_documents({})

    unique_skills = skills_collection.distinct(
        "skill_name"
    )

    normalized_skills = set()

    for skill in unique_skills:

        if skill:
            normalized_skills.add(
                normalize_skill_name(skill)
            )

    total_skills = len(
        normalized_skills
    )

    total_projects = projects_collection.count_documents({})

    return {
        "stats": {
            "total_employees": total_employees,
            "total_skills": total_skills,
            "total_projects": total_projects
        }
    }


# ============================================================
# PROFILE
# ============================================================

class ProfileUpdate(BaseModel):
    full_name: str
    email: str
    username: str
    department: str
    job_title: str
    bio: str


@app.get("/api/profile/{user_id}")
def get_profile(user_id: str):

    object_id = get_object_id(
        user_id
    )

    profile = profiles_collection.find_one(
        {
            "user_id": object_id
        }
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return {
        "profile": serialize_document(
            profile
        )
    }


@app.put("/api/profile/{user_id}")
def update_profile(
    user_id: str,
    data: ProfileUpdate
):

    object_id = get_object_id(
        user_id
    )

    existing_profile = profiles_collection.find_one(
        {
            "user_id": object_id
        }
    )

    if not existing_profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    update_data = {
        "full_name": data.full_name.strip(),
        "email": data.email.strip().lower(),
        "username": data.username.strip(),
        "department": data.department.strip(),
        "job_title": data.job_title.strip(),
        "bio": data.bio.strip(),
        "updated_at": datetime.utcnow()
    }

    profiles_collection.update_one(
        {
            "user_id": object_id
        },
        {
            "$set": update_data
        }
    )

    users_collection.update_one(
        {
            "_id": object_id
        },
        {
            "$set": {
                "full_name": data.full_name.strip(),
                "email": data.email.strip().lower(),
                "username": data.username.strip()
            }
        }
    )

    updated_profile = profiles_collection.find_one(
        {
            "user_id": object_id
        }
    )

    return {
        "message": "Profile updated successfully",
        "profile": serialize_document(
            updated_profile
        )
    }


# ============================================================
# SKILLS
# ============================================================

class SkillCreate(BaseModel):
    user_id: str
    skill_name: str
    proficiency: str


@app.post("/api/skills")
def add_skill(data: SkillCreate):

    user_object_id = get_object_id(
        data.user_id
    )

    user = users_collection.find_one(
        {
            "_id": user_object_id
        }
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    skill_name = data.skill_name.strip()

    if not skill_name:
        raise HTTPException(
            status_code=400,
            detail="Skill name cannot be empty"
        )

    existing_skill = skills_collection.find_one(
        {
            "user_id": user_object_id,
            "skill_name": {
                "$regex": f"^{re.escape(skill_name)}$",
                "$options": "i"
            }
        }
    )

    if existing_skill:
        raise HTTPException(
            status_code=400,
            detail="You already added this skill"
        )

    skill = {
        "user_id": user_object_id,
        "skill_name": skill_name,
        "proficiency": data.proficiency.strip(),
        "created_at": datetime.utcnow()
    }

    result = skills_collection.insert_one(
        skill
    )

    skill["_id"] = result.inserted_id

    return {
        "message": "Skill added successfully",
        "skill": serialize_document(skill)
    }


# ============================================================
# IMPORTANT:
# SKILL ANALYTICS ROUTES MUST COME BEFORE
# /api/skills/{user_id}
# ============================================================


@app.get("/api/skills/insights")
def skill_insights():

    total_employees = users_collection.count_documents({})

    all_skills = list(
        skills_collection.find({})
    )

    skill_users = {}

    for skill in all_skills:

        skill_name = skill.get(
            "skill_name",
            ""
        ).strip()

        user_id = skill.get(
            "user_id"
        )

        if not skill_name or not user_id:
            continue

        normalized_name = normalize_skill_name(
            skill_name
        )

        if normalized_name not in skill_users:

            skill_users[normalized_name] = {
                "skill_name": skill_name,
                "users": set()
            }

        skill_users[
            normalized_name
        ]["users"].add(
            str(user_id)
        )

    skill_data = []

    for normalized_name, data in skill_users.items():

        employee_count = len(
            data["users"]
        )

        percentage = 0

        if total_employees > 0:
            percentage = round(
                (
                    employee_count /
                    total_employees
                ) * 100,
                2
            )

        skill_data.append(
            {
                "skill_name": data["skill_name"],
                "employee_count": employee_count,
                "percentage": percentage
            }
        )

    skill_data.sort(
        key=lambda item: (
            -item["employee_count"],
            item["skill_name"].lower()
        )
    )

    return {
        "total_employees": total_employees,
        "total_unique_skills": len(skill_data),
        "skills": skill_data
    }


# ============================================================
# CORRECTED SKILL ANALYTICS
# ============================================================

@app.get("/api/skills/analytics")
def skill_analytics():

    total_employees = users_collection.count_documents({})

    all_skill_records = list(
        skills_collection.find({})
    )

    skill_information = {}

    # --------------------------------------------------------
    # BUILD UNIQUE SKILL INFORMATION
    # --------------------------------------------------------

    for record in all_skill_records:

        skill_name = record.get(
            "skill_name",
            ""
        ).strip()

        user_id = record.get(
            "user_id"
        )

        if not skill_name or not user_id:
            continue

        normalized_name = normalize_skill_name(
            skill_name
        )

        if normalized_name not in skill_information:

            skill_information[normalized_name] = {
                "skill_name": skill_name,
                "users": set(),
                "proficiency": {
                    "Beginner": 0,
                    "Intermediate": 0,
                    "Advanced": 0,
                    "Expert": 0
                }
            }

        # Add unique user
        skill_information[
            normalized_name
        ]["users"].add(
            str(user_id)
        )

        # ----------------------------------------------------
        # PROFICIENCY
        # ----------------------------------------------------

        proficiency = str(
            record.get(
                "proficiency",
                ""
            )
        ).strip().lower()

        if proficiency == "beginner":

            skill_information[
                normalized_name
            ]["proficiency"]["Beginner"] += 1

        elif proficiency in [
            "intermediate",
            "intermediary"
        ]:

            skill_information[
                normalized_name
            ]["proficiency"]["Intermediate"] += 1

        elif proficiency in [
            "advanced",
            "advance"
        ]:

            skill_information[
                normalized_name
            ]["proficiency"]["Advanced"] += 1

        elif proficiency == "expert":

            skill_information[
                normalized_name
            ]["proficiency"]["Expert"] += 1


    # --------------------------------------------------------
    # BUILD SKILL DATA
    # --------------------------------------------------------

    skill_data = []

    for normalized_name, data in skill_information.items():

        user_count = len(
            data["users"]
        )

        percentage = 0

        if total_employees > 0:

            percentage = round(
                (
                    user_count /
                    total_employees
                ) * 100,
                2
            )

        skill_data.append(
            {
                "skill_name": data["skill_name"],
                "user_count": user_count,
                "employee_count": user_count,
                "percentage": percentage,

                "beginner": data[
                    "proficiency"
                ]["Beginner"],

                "intermediate": data[
                    "proficiency"
                ]["Intermediate"],

                "advanced": data[
                    "proficiency"
                ]["Advanced"],

                "expert": data[
                    "proficiency"
                ]["Expert"]
            }
        )


    # --------------------------------------------------------
    # MOST POPULAR SKILLS
    #
    # Highest number of users first.
    # If counts are equal, alphabetical order.
    # --------------------------------------------------------

    popular_skills = sorted(
        skill_data,
        key=lambda item: (
            -item["user_count"],
            item["skill_name"].lower()
        )
    )


    # --------------------------------------------------------
    # LEAST COMMON SKILLS
    #
    # IMPORTANT:
    # Only skills having the MINIMUM user count are included.
    #
    # Example:
    #
    # React.js = 2
    # Node.js  = 2
    # Python   = 1
    # SQL      = 1
    #
    # Least common = Python + SQL
    #
    # React.js and Node.js MUST NOT appear here.
    # --------------------------------------------------------

    least_common_skills = []

    if skill_data:

        minimum_user_count = min(
            skill["user_count"]
            for skill in skill_data
        )

        least_common_skills = [
            skill
            for skill in skill_data
            if skill["user_count"] == minimum_user_count
        ]

        least_common_skills.sort(
            key=lambda item:
                item["skill_name"].lower()
        )


    # --------------------------------------------------------
    # OVERALL PROFICIENCY
    # --------------------------------------------------------

    overall_proficiency = {
        "Beginner": 0,
        "Intermediate": 0,
        "Advanced": 0,
        "Expert": 0
    }

    for record in all_skill_records:

        proficiency = str(
            record.get(
                "proficiency",
                ""
            )
        ).strip().lower()

        if proficiency == "beginner":

            overall_proficiency[
                "Beginner"
            ] += 1

        elif proficiency in [
            "intermediate",
            "intermediary"
        ]:

            overall_proficiency[
                "Intermediate"
            ] += 1

        elif proficiency in [
            "advanced",
            "advance"
        ]:

            overall_proficiency[
                "Advanced"
            ] += 1

        elif proficiency == "expert":

            overall_proficiency[
                "Expert"
            ] += 1


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "total_employees": total_employees,

        "total_unique_skills": len(
            skill_data
        ),

        "total_skill_records": len(
            all_skill_records
        ),

        "popular_skills": popular_skills,

        "least_common_skills": least_common_skills,

        "skills": skill_data,

        "proficiency_by_skill": skill_data,

        "overall_proficiency": overall_proficiency
    }


# ============================================================
# SKILL GAPS
# ============================================================

@app.get("/api/skills/gaps")
def skill_gaps():

    total_employees = users_collection.count_documents({})

    all_skills = list(
        skills_collection.find({})
    )

    skill_users = {}

    for skill in all_skills:

        skill_name = skill.get(
            "skill_name",
            ""
        ).strip()

        user_id = skill.get(
            "user_id"
        )

        if not skill_name or not user_id:
            continue

        normalized_name = normalize_skill_name(
            skill_name
        )

        if normalized_name not in skill_users:

            skill_users[normalized_name] = {
                "skill_name": skill_name,
                "users": set()
            }

        skill_users[
            normalized_name
        ]["users"].add(
            str(user_id)
        )

    gaps = []

    for normalized_name, data in skill_users.items():

        employee_count = len(
            data["users"]
        )

        percentage = 0

        if total_employees > 0:

            percentage = round(
                (
                    employee_count /
                    total_employees
                ) * 100,
                2
            )

        gaps.append(
            {
                "skill_name": data["skill_name"],
                "employee_count": employee_count,
                "user_count": employee_count,
                "coverage_percentage": percentage
            }
        )

    gaps.sort(
        key=lambda item: (
            item["employee_count"],
            item["skill_name"].lower()
        )
    )

    return {
        "total_employees": total_employees,
        "skill_gaps": gaps
    }


# ============================================================
# GET USER SKILLS
# ============================================================

@app.get("/api/skills/{user_id}")
def get_user_skills(user_id: str):

    user_object_id = get_object_id(
        user_id
    )

    user = users_collection.find_one(
        {
            "_id": user_object_id
        }
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    skills = list(
        skills_collection.find(
            {
                "user_id": user_object_id
            }
        ).sort(
            "created_at",
            -1
        )
    )

    return {
        "skills": [
            serialize_document(skill)
            for skill in skills
        ]
    }


# ============================================================
# DELETE SKILL
# ============================================================

@app.delete("/api/skills/{skill_id}")
def delete_skill(skill_id: str):

    try:
        object_id = ObjectId(
            skill_id
        )
    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid skill ID"
        )

    result = skills_collection.delete_one(
        {
            "_id": object_id
        }
    )

    if result.deleted_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Skill not found"
        )

    return {
        "message": "Skill deleted successfully"
    }


# ============================================================
# PROJECTS
# ============================================================

class ProjectCreate(BaseModel):
    user_id: str
    project_name: str
    description: str
    skills_used: list[str]


@app.post("/api/projects")
def add_project(data: ProjectCreate):

    user_object_id = get_object_id(
        data.user_id
    )

    user = users_collection.find_one(
        {
            "_id": user_object_id
        }
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    project_name = data.project_name.strip()

    if not project_name:

        raise HTTPException(
            status_code=400,
            detail="Project name cannot be empty"
        )

    project = {
        "user_id": user_object_id,
        "project_name": project_name,
        "description": data.description.strip(),
        "skills_used": [
            skill.strip()
            for skill in data.skills_used
            if skill.strip()
        ],
        "created_at": datetime.utcnow()
    }

    result = projects_collection.insert_one(
        project
    )

    project["_id"] = result.inserted_id

    return {
        "message": "Project added successfully",
        "project": serialize_document(
            project
        )
    }


@app.get("/api/projects/{user_id}")
def get_user_projects(user_id: str):

    user_object_id = get_object_id(
        user_id
    )

    user = users_collection.find_one(
        {
            "_id": user_object_id
        }
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    projects = list(
        projects_collection.find(
            {
                "user_id": user_object_id
            }
        ).sort(
            "created_at",
            -1
        )
    )

    return {
        "projects": [
            serialize_document(project)
            for project in projects
        ]
    }


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str):

    try:
        object_id = ObjectId(
            project_id
        )
    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid project ID"
        )

    result = projects_collection.delete_one(
        {
            "_id": object_id
        }
    )

    if result.deleted_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return {
        "message": "Project deleted successfully"
    }


# ============================================================
# SEARCH PEOPLE
# ============================================================

@app.get("/api/search/people")
def search_people(
    skill: str = Query(...)
):

    skill = skill.strip()

    if not skill:

        return {
            "people": [],
            "total": 0
        }

    matching_skills = list(
        skills_collection.find(
            {
                "skill_name": {
                    "$regex": re.escape(skill),
                    "$options": "i"
                }
            }
        )
    )

    user_ids = list(
        {
            skill_record["user_id"]
            for skill_record in matching_skills
            if skill_record.get("user_id")
        }
    )

    people = []

    for user_id in user_ids:

        user = users_collection.find_one(
            {
                "_id": user_id
            }
        )

        if not user:
            continue

        profile = profiles_collection.find_one(
            {
                "user_id": user_id
            }
        )

        person_skills = get_skill_records_for_user(
            user_id
        )

        person_projects = get_projects_for_user(
            user_id
        )

        people.append(
            {
                "id": str(user_id),
                "full_name": user.get(
                    "full_name",
                    ""
                ),
                "username": user.get(
                    "username",
                    ""
                ),
                "email": user.get(
                    "email",
                    ""
                ),
                "department": (
                    profile.get(
                        "department",
                        ""
                    )
                    if profile
                    else ""
                ),
                "job_title": (
                    profile.get(
                        "job_title",
                        ""
                    )
                    if profile
                    else ""
                ),
                "bio": (
                    profile.get(
                        "bio",
                        ""
                    )
                    if profile
                    else ""
                ),
                "skills": [
                    serialize_document(skill)
                    for skill in person_skills
                ],
                "projects": [
                    serialize_document(project)
                    for project in person_projects
                ]
            }
        )

    return {
        "people": people,
        "total": len(people)
    }


# ============================================================
# EMPLOYEES
# ============================================================

@app.get("/api/employees")
def get_employees():

    users = list(
        users_collection.find({})
    )

    employees = []

    for user in users:

        user_id = user["_id"]

        profile = profiles_collection.find_one(
            {
                "user_id": user_id
            }
        )

        employee_skills = get_skill_records_for_user(
            user_id
        )

        employee_projects = get_projects_for_user(
            user_id
        )

        employees.append(
            {
                "id": str(user_id),
                "full_name": user.get(
                    "full_name",
                    ""
                ),
                "username": user.get(
                    "username",
                    ""
                ),
                "email": user.get(
                    "email",
                    ""
                ),
                "department": (
                    profile.get(
                        "department",
                        ""
                    )
                    if profile
                    else ""
                ),
                "job_title": (
                    profile.get(
                        "job_title",
                        ""
                    )
                    if profile
                    else ""
                ),
                "bio": (
                    profile.get(
                        "bio",
                        ""
                    )
                    if profile
                    else ""
                ),
                "skills": [
                    serialize_document(skill)
                    for skill in employee_skills
                ],
                "projects": [
                    serialize_document(project)
                    for project in employee_projects
                ]
            }
        )

    return {
        "employees": employees,
        "total": len(employees)
    }


# ============================================================
# GRAPH DATA
# ============================================================

@app.get("/api/graph")
def get_graph_data():

    users = list(
        users_collection.find({})
    )

    skills = list(
        skills_collection.find({})
    )

    projects = list(
        projects_collection.find({})
    )

    nodes = []
    links = []

    employee_ids = set()
    project_ids = set()
    skill_names = set()

    # --------------------------------------------------------
    # EMPLOYEE NODES
    # --------------------------------------------------------

    for user in users:

        user_id = str(
            user["_id"]
        )

        employee_ids.add(
            user_id
        )

        nodes.append(
            {
                "id": f"employee-{user_id}",
                "label": user.get(
                    "full_name",
                    user.get(
                        "username",
                        "Employee"
                    )
                ),
                "name": user.get(
                    "full_name",
                    user.get(
                        "username",
                        "Employee"
                    )
                ),
                "type": "employee",
                "username": user.get(
                    "username",
                    ""
                ),
                "email": user.get(
                    "email",
                    ""
                )
            }
        )

    # --------------------------------------------------------
    # SKILL NODES
    # --------------------------------------------------------

    unique_skill_labels = {}

    for skill in skills:

        skill_name = skill.get(
            "skill_name",
            ""
        ).strip()

        if not skill_name:
            continue

        normalized = normalize_skill_name(
            skill_name
        )

        if normalized not in unique_skill_labels:

            unique_skill_labels[
                normalized
            ] = skill_name

        skill_names.add(
            normalized
        )

    # Also include project skills

    for project in projects:

        for project_skill in project.get(
            "skills_used",
            []
        ):

            skill_name = str(
                project_skill
            ).strip()

            if not skill_name:
                continue

            normalized = normalize_skill_name(
                skill_name
            )

            if normalized not in unique_skill_labels:

                unique_skill_labels[
                    normalized
                ] = skill_name

            skill_names.add(
                normalized
            )

    for normalized, label in unique_skill_labels.items():

        nodes.append(
            {
                "id": f"skill-{normalized}",
                "label": label,
                "name": label,
                "type": "skill"
            }
        )

    # --------------------------------------------------------
    # EMPLOYEE -> SKILL
    # --------------------------------------------------------

    for skill in skills:

        user_id = skill.get(
            "user_id"
        )

        skill_name = skill.get(
            "skill_name",
            ""
        ).strip()

        if not user_id or not skill_name:
            continue

        normalized = normalize_skill_name(
            skill_name
        )

        links.append(
            {
                "source": f"employee-{str(user_id)}",
                "target": f"skill-{normalized}",
                "type": "employee-skill"
            }
        )

    # --------------------------------------------------------
    # PROJECT NODES
    # --------------------------------------------------------

    for project in projects:

        project_id = str(
            project["_id"]
        )

        project_ids.add(
            project_id
        )

        project_node_id = (
            f"project-{project_id}"
        )

        project_name = project.get(
            "project_name",
            "Project"
        )

        nodes.append(
            {
                "id": project_node_id,
                "label": project_name,
                "name": project_name,
                "type": "project",
                "description": project.get(
                    "description",
                    ""
                )
            }
        )

        user_id = project.get(
            "user_id"
        )

        if user_id:

            employee_exists = users_collection.find_one(
                {
                    "_id": user_id
                }
            )

            if employee_exists:

                links.append(
                    {
                        "source": (
                            f"employee-{str(user_id)}"
                        ),
                        "target": project_node_id,
                        "type": "employee-project"
                    }
                )

        for project_skill in project.get(
            "skills_used",
            []
        ):

            skill_name = str(
                project_skill
            ).strip()

            if not skill_name:
                continue

            normalized = normalize_skill_name(
                skill_name
            )

            links.append(
                {
                    "source": project_node_id,
                    "target": f"skill-{normalized}",
                    "type": "project-skill"
                }
            )

    return {
        "nodes": nodes,
        "links": links,
        "summary": {
            "employees": len(
                employee_ids
            ),
            "skills": len(
                skill_names
            ),
            "projects": len(
                project_ids
            ),
            "connections": len(
                links
            )
        }
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health_check():

    try:

        users_collection.count_documents({})

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as error:

        return {
            "status": "unhealthy",
            "database": "error",
            "message": str(error)
        }