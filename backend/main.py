from fastapi import FastAPI, HTTPException, Query, Request, Depends, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, RedirectResponse
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
from datetime import timedelta
from hashlib import sha256
import secrets
import bcrypt
import re
from typing import Any
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4
import os

try:
    import msal
except ImportError:
    msal = None

from database import (
    users_collection,
    profiles_collection,
    skills_collection,
    projects_collection,
    sessions_collection,
    tasks_collection,
    certifications_collection,
    oauth_states_collection,
)
from admin_routes import router as admin_router


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="SkillConnect API",
    description="Backend API for SkillConnect employee skill management platform",
    version="1.0.0"
)
app.include_router(admin_router)


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


@app.middleware("http")
async def authenticate_api_requests(request: Request, call_next):
    public_paths = {
        "/api/auth/login",
        "/api/auth/signup",
        "/api/health",
        "/api/auth/providers",
        "/api/auth/microsoft/login",
        "/api/auth/microsoft/callback",
    }
    if (
        request.url.path.startswith("/api/")
        and request.url.path not in public_paths
        and request.method != "OPTIONS"
    ):
        authorization = request.headers.get("authorization", "")
        token = authorization.removeprefix("Bearer ").strip() if authorization.startswith("Bearer ") else request.cookies.get("skillconnect_session", "")
        if not token:
            return JSONResponse(
                status_code=401,
                content={"detail": "Please sign in to continue."},
            )

        session = sessions_collection.find_one({
            "token_hash": sha256(token.encode("utf-8")).hexdigest(),
            "expires_at": {"$gt": datetime.utcnow()},
        })
        if not session:
            return JSONResponse(
                status_code=401,
                content={"detail": "Session expired. Please sign in again."},
            )

        user = users_collection.find_one({"_id": session["user_id"]})
        if not user or user.get("is_active", True) is False:
            return JSONResponse(
                status_code=401,
                content={"detail": "This account is inactive."},
            )
        request.state.current_user = user

    return await call_next(request)


def get_current_user(request: Request):
    user = getattr(request.state, "current_user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Please sign in to continue.")
    return user


def ensure_user_access(target_user_id, current_user, allow_admin=True):
    if str(target_user_id) == str(current_user["_id"]):
        return
    if allow_admin and current_user.get("role", "employee") == "admin":
        return
    raise HTTPException(status_code=403, detail="You can only access your own account data.")


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

def serialize_document(document) -> dict[str, Any] | None:
    if not document:
        return None

    def make_json_safe(value: Any) -> Any:
        if isinstance(value, ObjectId):
            return str(value)
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, dict):
            return {key: make_json_safe(item) for key, item in value.items()}
        if isinstance(value, (list, tuple)):
            return [make_json_safe(item) for item in value]
        return value

    return make_json_safe(dict(document))


def serialize_certification(document):
    serialized = serialize_document(document) or {}
    if serialized.get('_id') is not None:
        serialized['id'] = serialized['_id']
    return serialized


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
    role: str = "employee"


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
        "role": "employee",
        "is_active": True,
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
def login(data: LoginRequest, response: Response):

    if os.getenv("SSO_REQUIRED", "false").lower() == "true":
        raise HTTPException(status_code=403, detail="Use your CirrusLabs Microsoft account to sign in.")

    if data.role not in {"admin", "employee"}:
        raise HTTPException(status_code=400, detail="Choose a valid account type.")

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

    if user.get("is_active", True) is False:
        raise HTTPException(status_code=403, detail="This account is inactive. Contact an administrator.")

    actual_role = user.get("role", "employee")
    if actual_role != data.role:
        raise HTTPException(status_code=403, detail=f"This account is not authorized for {data.role} sign in.")

    token = secrets.token_urlsafe(32)
    sessions_collection.insert_one({
        "token_hash": sha256(token.encode("utf-8")).hexdigest(),
        "user_id": user["_id"],
        "expires_at": datetime.utcnow() + timedelta(hours=12),
        "created_at": datetime.utcnow(),
    })
    response.set_cookie(
        "skillconnect_session", token, httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="lax", max_age=12 * 60 * 60, path="/",
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
            ),
            "role": user.get("role", "employee"),
            "is_active": user.get("is_active", True),
        }
    }


@app.post("/api/auth/logout")
def logout(request: Request, response: Response, current_user=Depends(get_current_user)):
    authorization = request.headers.get("authorization", "")
    token = authorization.removeprefix("Bearer ").strip() if authorization.startswith("Bearer ") else request.cookies.get("skillconnect_session", "")
    sessions_collection.delete_one({"token_hash": sha256(token.encode("utf-8")).hexdigest()})
    response.delete_cookie("skillconnect_session", path="/", httponly=True, samesite="lax")
    return {"message": "Signed out successfully."}


def microsoft_settings():
    keys = ("MS_TENANT_ID", "MS_CLIENT_ID", "MS_CLIENT_SECRET", "MS_REDIRECT_URI", "MS_ALLOWED_GROUP_ID")
    return {key: os.getenv(key, "").strip() for key in keys}


def microsoft_authority(settings):
    return f"https://login.microsoftonline.com/{settings['MS_TENANT_ID']}"


def microsoft_app(settings):
    if msal is None:
        raise HTTPException(status_code=503, detail="Microsoft sign-in dependencies are not installed.")
    return msal.ConfidentialClientApplication(
        settings["MS_CLIENT_ID"], authority=microsoft_authority(settings),
        client_credential=settings["MS_CLIENT_SECRET"],
    )


@app.get("/api/auth/providers")
def auth_providers():
    settings = microsoft_settings()
    configured = bool(all(settings.values()) and msal is not None)
    return {
        "microsoft_enabled": configured,
        "password_login_enabled": os.getenv("SSO_REQUIRED", "false").lower() != "true",
    }


@app.get("/api/auth/microsoft/login")
def microsoft_login():
    settings = microsoft_settings()
    if not all(settings.values()) or msal is None:
        raise HTTPException(status_code=503, detail="Microsoft sign-in is not configured. Ask CirrusLabs IT to complete the app registration settings.")
    flow = microsoft_app(settings).initiate_auth_code_flow(
        scopes=["openid", "profile", "email"],
        redirect_uri=settings["MS_REDIRECT_URI"],
    )
    state = flow.get("state")
    if not state or not flow.get("auth_uri"):
        raise HTTPException(status_code=503, detail="Could not start Microsoft sign-in.")
    oauth_states_collection.insert_one({
        "state": state, "flow": flow,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "created_at": datetime.utcnow(),
    })
    return RedirectResponse(flow["auth_uri"], status_code=302)


@app.get("/api/auth/microsoft/callback")
def microsoft_callback(request: Request):
    settings = microsoft_settings()
    callback_query = dict(request.query_params)
    state = callback_query.get("state", "")
    stored_flow = oauth_states_collection.find_one_and_delete({
        "state": state, "expires_at": {"$gt": datetime.utcnow()},
    }) if state else None
    frontend = os.getenv("SSO_FRONTEND_URL", "http://127.0.0.1:5173").rstrip("/")
    if not stored_flow or not all(settings.values()) or msal is None:
        return RedirectResponse(f"{frontend}/employee/login?authError=microsoft_signin_failed", status_code=303)
    try:
        token_result = microsoft_app(settings).acquire_token_by_auth_code_flow(
            stored_flow["flow"], callback_query,
        )
    except (ValueError, TypeError):
        return RedirectResponse(f"{frontend}/employee/login?authError=microsoft_signin_failed", status_code=303)
    claims = token_result.get("id_token_claims") if isinstance(token_result, dict) else None
    tenant_id = settings["MS_TENANT_ID"].lower()
    expected_issuer = f"https://login.microsoftonline.com/{tenant_id}/v2.0"
    if not claims or claims.get("tid", "").lower() != tenant_id or claims.get("aud") != settings["MS_CLIENT_ID"] or claims.get("iss") != expected_issuer:
        return RedirectResponse(f"{frontend}/employee/login?authError=microsoft_signin_failed", status_code=303)
    groups = claims.get("groups")
    if not isinstance(groups, list) or settings["MS_ALLOWED_GROUP_ID"].lower() not in {str(group).lower() for group in groups}:
        return RedirectResponse(f"{frontend}/employee/login?authError=organization_access_required", status_code=303)
    email = str(claims.get("preferred_username") or claims.get("email") or "").strip().lower()
    entra_oid = str(claims.get("oid") or "")
    if not email or not entra_oid:
        return RedirectResponse(f"{frontend}/employee/login?authError=microsoft_signin_failed", status_code=303)
    user = users_collection.find_one({"entra_tenant_id": tenant_id, "entra_oid": entra_oid})
    if not user:
        user = users_collection.find_one({"email": email})
    now = datetime.utcnow()
    admin_group = os.getenv("MS_ADMIN_GROUP_ID", "").strip().lower()
    is_admin_member = bool(admin_group and admin_group in {str(group).lower() for group in groups})
    display_name = str(claims.get("name") or email.split("@", 1)[0]).strip()
    username = str(claims.get("preferred_username") or email).split("@", 1)[0].strip()
    if user:
        if user.get("is_active", True) is False:
            return RedirectResponse(f"{frontend}/employee/login?authError=account_inactive", status_code=303)
        update = {"entra_tenant_id": tenant_id, "entra_oid": entra_oid}
        if admin_group:
            update["role"] = "admin" if is_admin_member else "employee"
        users_collection.update_one({"_id": user["_id"]}, {"$set": update})
        user.update(update)
    else:
        user = {
            "full_name": display_name, "username": username, "email": email,
            "password": "", "role": "admin" if is_admin_member else "employee",
            "is_active": True, "entra_tenant_id": tenant_id, "entra_oid": entra_oid,
            "created_at": now,
        }
        user["_id"] = users_collection.insert_one(user).inserted_id
        profiles_collection.insert_one({
            "user_id": user["_id"], "full_name": display_name,
            "username": username, "email": email, "department": "",
            "job_title": "", "bio": "", "teams_link": "",
            "created_at": now, "updated_at": now,
        })
    token = secrets.token_urlsafe(32)
    sessions_collection.insert_one({
        "token_hash": sha256(token.encode("utf-8")).hexdigest(),
        "user_id": user["_id"], "expires_at": now + timedelta(hours=12),
        "created_at": now,
    })
    redirect_path = "/admin/dashboard" if user.get("role") == "admin" else "/employee/dashboard"
    redirect = RedirectResponse(f"{frontend}{redirect_path}", status_code=303)
    redirect.set_cookie("skillconnect_session", token, httponly=True,
                        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
                        samesite="lax", max_age=12 * 60 * 60, path="/")
    return redirect


@app.get("/api/auth/me")
def auth_me(current_user=Depends(get_current_user)):
    return {"user": {
        "id": str(current_user["_id"]),
        "full_name": current_user.get("full_name", ""),
        "username": current_user.get("username", ""),
        "email": current_user.get("email", ""),
        "role": current_user.get("role", "employee"),
        "is_active": current_user.get("is_active", True),
    }}


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
    teams_link: str = ""


class PreferencesUpdate(BaseModel):
    compact_tables: bool = False
    reduce_motion: bool = False


@app.get("/api/preferences")
def get_account_preferences(current_user=Depends(get_current_user)):
    profile = profiles_collection.find_one({"user_id": current_user["_id"]}) or {}
    preferences = profile.get("preferences") or {}
    return {
        "preferences": {
            "compact_tables": bool(preferences.get("compact_tables", False)),
            "reduce_motion": bool(preferences.get("reduce_motion", False)),
        }
    }


@app.put("/api/preferences")
def update_account_preferences(data: PreferencesUpdate, current_user=Depends(get_current_user)):
    preferences = data.model_dump()
    profiles_collection.update_one(
        {"user_id": current_user["_id"]},
        {"$set": {"preferences": preferences, "updated_at": datetime.utcnow()}},
        upsert=True,
    )
    return {"message": "Account preferences saved.", "preferences": preferences}


@app.get("/api/profile/{user_id}")
def get_profile(user_id: str, current_user=Depends(get_current_user)):

    object_id = get_object_id(
        user_id
    )
    ensure_user_access(object_id, current_user)

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
    data: ProfileUpdate,
    current_user=Depends(get_current_user),
):

    object_id = get_object_id(
        user_id
    )
    ensure_user_access(object_id, current_user)

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

    teams_link = data.teams_link.strip()
    if teams_link:
        parsed_link = urlparse(teams_link)
        if parsed_link.scheme != "https" or (parsed_link.hostname or "").lower() not in {"teams.microsoft.com", "teams.live.com"}:
            raise HTTPException(status_code=400, detail="Use a valid HTTPS Microsoft Teams contact link.")

    identity_locked = bool(current_user.get("entra_oid"))
    display_name = data.full_name.strip()
    email = current_user.get("email", "") if identity_locked else data.email.strip().lower()
    username = current_user.get("username", "") if identity_locked else data.username.strip()
    update_data = {
        "full_name": display_name,
        "email": email,
        "username": username,
        "department": data.department.strip(),
        "job_title": data.job_title.strip(),
        "bio": data.bio.strip(),
        "teams_link": teams_link,
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
                "full_name": display_name,
                "email": email,
                "username": username
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
    category: str = ""
    years_experience: float | None = None


@app.post("/api/skills")
def add_skill(data: SkillCreate, current_user=Depends(get_current_user)):

    user_object_id = get_object_id(
        data.user_id
    )
    ensure_user_access(user_object_id, current_user)

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
        "category": data.category.strip(),
        "years_experience": max(0, min(float(data.years_experience or 0), 80)),
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


@app.patch("/api/skills/{skill_id}")
def update_skill(skill_id: str, data: SkillCreate, current_user=Depends(get_current_user)):
    skill_id_object = get_object_id(skill_id)
    existing = skills_collection.find_one({"_id": skill_id_object})
    if not existing:
        raise HTTPException(status_code=404, detail="Skill not found.")
    ensure_user_access(existing.get("user_id"), current_user)
    new_name = data.skill_name.strip()
    if not new_name or not data.proficiency.strip():
        raise HTTPException(status_code=400, detail="Skill name and proficiency are required.")
    skills_collection.update_one({"_id": skill_id_object}, {"$set": {
        "skill_name": new_name, "proficiency": data.proficiency.strip(),
        "category": data.category.strip(),
        "years_experience": max(0, min(float(data.years_experience or 0), 80)),
    }})
    return {"skill": serialize_document(skills_collection.find_one({"_id": skill_id_object}))}


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
def get_user_skills(user_id: str, current_user=Depends(get_current_user)):

    user_object_id = get_object_id(
        user_id
    )
    ensure_user_access(user_object_id, current_user)

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
def delete_skill(skill_id: str, current_user=Depends(get_current_user)):

    try:
        object_id = ObjectId(
            skill_id
        )
    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid skill ID"
        )

    skill = skills_collection.find_one({"_id": object_id})
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    ensure_user_access(skill.get("user_id"), current_user)
    result = skills_collection.delete_one({"_id": object_id})

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
def add_project(data: ProjectCreate, current_user=Depends(get_current_user)):

    user_object_id = get_object_id(
        data.user_id
    )
    ensure_user_access(user_object_id, current_user)

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
def get_user_projects(user_id: str, current_user=Depends(get_current_user)):

    user_object_id = get_object_id(
        user_id
    )
    ensure_user_access(user_object_id, current_user)

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
def delete_project(project_id: str, current_user=Depends(get_current_user)):

    try:
        object_id = ObjectId(
            project_id
        )
    except Exception:

        raise HTTPException(
            status_code=400,
            detail="Invalid project ID"
        )

    project = projects_collection.find_one({"_id": object_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    ensure_user_access(project.get("user_id"), current_user)
    result = projects_collection.delete_one({"_id": object_id})

    if result.deleted_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return {
        "message": "Project deleted successfully"
    }


# ============================================================
# TASKS
# ============================================================

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    assignee_id: str
    project_name: str | None = None
    due_date: str | None = None


class TaskStatusUpdate(BaseModel):
    status: str


TASK_STATUSES = {"todo", "in_progress", "blocked", "done"}
EMPLOYEE_STATUS_TRANSITIONS = {
    "todo": {"in_progress", "blocked"},
    "in_progress": {"blocked", "done"},
    "blocked": {"in_progress"},
    "done": set(),
}


def serialize_task(task):
    if not task:
        return None
    result = dict(task)
    result["id"] = str(result.pop("_id"))
    for field in ("assignee_id", "assigned_by"):
        if result.get(field) is not None:
            result[field] = str(result[field])
    return result


def require_admin_user(user):
    if user.get("role", "employee") != "admin":
        raise HTTPException(status_code=403, detail="Admin access is required.")


@app.get("/api/tasks")
def list_tasks(current_user=Depends(get_current_user)):
    query = {} if current_user.get("role") == "admin" else {"assignee_id": current_user["_id"]}
    tasks = tasks_collection.find(query).sort("updated_at", -1)
    return {"tasks": [serialize_task(task) for task in tasks]}


@app.post("/api/admin/tasks")
def create_task(data: TaskCreate, current_user=Depends(get_current_user)):
    require_admin_user(current_user)
    title = data.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Task title is required.")
    assignee_id = get_object_id(data.assignee_id)
    assignee = users_collection.find_one({"_id": assignee_id, "is_active": {"$ne": False}})
    if not assignee:
        raise HTTPException(status_code=404, detail="Active employee not found.")
    if assignee.get("role", "employee") != "employee":
        raise HTTPException(status_code=400, detail="Choose an employee account for assignment.")
    now = datetime.utcnow()
    task = {
        "title": title,
        "description": data.description.strip(),
        "assignee_id": assignee_id,
        "assigned_by": current_user["_id"],
        "project_name": (data.project_name or "").strip(),
        "due_date": data.due_date,
        "status": "todo",
        "created_at": now,
        "updated_at": now,
    }
    task["_id"] = tasks_collection.insert_one(task).inserted_id
    return {"task": serialize_task(task)}


@app.patch("/api/tasks/{task_id}/status")
def update_task_status(task_id: str, data: TaskStatusUpdate, current_user=Depends(get_current_user)):
    if data.status not in TASK_STATUSES:
        raise HTTPException(status_code=400, detail="Choose a valid task status.")
    task_object_id = get_object_id(task_id)
    task = tasks_collection.find_one({"_id": task_object_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    is_admin = current_user.get("role", "employee") == "admin"
    if not is_admin and task.get("assignee_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="You can only update tasks assigned to you.")
    old_status = task.get("status", "todo")
    if not is_admin and data.status not in EMPLOYEE_STATUS_TRANSITIONS.get(old_status, set()):
        raise HTTPException(status_code=400, detail="That status change is not allowed.")
    tasks_collection.update_one({"_id": task_object_id}, {"$set": {"status": data.status, "updated_at": datetime.utcnow()}})
    updated = tasks_collection.find_one({"_id": task_object_id})
    return {"task": serialize_task(updated)}


@app.put("/api/admin/tasks/{task_id}")
def update_task(task_id: str, data: TaskCreate, current_user=Depends(get_current_user)):
    require_admin_user(current_user)
    task_object_id = get_object_id(task_id)
    if not tasks_collection.find_one({"_id": task_object_id}):
        raise HTTPException(status_code=404, detail="Task not found.")
    assignee_id = get_object_id(data.assignee_id)
    assignee = users_collection.find_one({"_id": assignee_id, "role": "employee", "is_active": {"$ne": False}})
    if not assignee:
        raise HTTPException(status_code=404, detail="Active employee not found.")
    if not data.title.strip():
        raise HTTPException(status_code=400, detail="Task title is required.")
    tasks_collection.update_one({"_id": task_object_id}, {"$set": {
        "title": data.title.strip(), "description": data.description.strip(),
        "assignee_id": assignee_id, "project_name": (data.project_name or "").strip(),
        "due_date": data.due_date, "updated_at": datetime.utcnow(),
    }})
    return {"task": serialize_task(tasks_collection.find_one({"_id": task_object_id}))}


@app.delete("/api/admin/tasks/{task_id}")
def delete_task(task_id: str, current_user=Depends(get_current_user)):
    require_admin_user(current_user)
    result = tasks_collection.delete_one({"_id": get_object_id(task_id)})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"message": "Task deleted."}


# ============================================================
# CERTIFICATIONS AND PRIVATE PROOF UPLOADS
# ============================================================

class CertificationInput(BaseModel):
    name: str
    issuer: str = ""
    issue_date: str = ""
    expiration_date: str = ""
    credential_id: str = ""
    verification_url: str = ""
    notes: str = ""


MAX_CERTIFICATE_BYTES = 10 * 1024 * 1024
PRIVATE_UPLOAD_DIR = Path(__file__).resolve().parent / "private_uploads"
PROOF_TYPES = {
    ".jpg": ("image/jpeg", lambda data: data.startswith(b"\xff\xd8\xff")),
    ".jpeg": ("image/jpeg", lambda data: data.startswith(b"\xff\xd8\xff")),
    ".png": ("image/png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
    ".pdf": ("application/pdf", lambda data: data.startswith(b"%PDF-")),
}


def safe_certification_url(url):
    value = (url or "").strip()
    if not value:
        return ""
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.hostname:
        raise HTTPException(status_code=400, detail="Verification links must use HTTPS.")
    if parsed.username or parsed.password:
        raise HTTPException(status_code=400, detail="Verification links cannot contain credentials.")
    return value


def owner_or_admin(record, current_user):
    if record.get("user_id") != current_user["_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="You cannot access this employee record.")


@app.get("/api/certifications")
def list_certifications(current_user=Depends(get_current_user)):
    query = {} if current_user.get("role") == "admin" else {"user_id": current_user["_id"]}
    records = certifications_collection.find(query).sort("created_at", -1)
    return {"certifications": [serialize_certification(item) for item in records]}


@app.post("/api/certifications")
def add_certification(data: CertificationInput, current_user=Depends(get_current_user)):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Certification name is required.")
    now = datetime.utcnow()
    certification = {
        "user_id": current_user["_id"], "name": data.name.strip(),
        "issuer": data.issuer.strip(), "issue_date": data.issue_date.strip(),
        "expiration_date": data.expiration_date.strip(), "credential_id": data.credential_id.strip(),
        "verification_url": safe_certification_url(data.verification_url),
        "notes": data.notes.strip(), "verification_status": "submitted",
        "proof": None, "created_at": now, "updated_at": now,
    }
    certification["_id"] = certifications_collection.insert_one(certification).inserted_id
    return {"certification": serialize_certification(certification)}


@app.patch("/api/certifications/{certification_id}")
def edit_certification(certification_id: str, data: CertificationInput, current_user=Depends(get_current_user)):
    cert_id = get_object_id(certification_id)
    record = certifications_collection.find_one({"_id": cert_id})
    if not record:
        raise HTTPException(status_code=404, detail="Certification not found.")
    owner_or_admin(record, current_user)
    if current_user.get("role") != "admin" and record.get("user_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="You can only edit your own certifications.")
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Certification name is required.")
    certifications_collection.update_one({"_id": cert_id}, {"$set": {
        "name": data.name.strip(), "issuer": data.issuer.strip(),
        "issue_date": data.issue_date.strip(), "expiration_date": data.expiration_date.strip(),
        "credential_id": data.credential_id.strip(),
        "verification_url": safe_certification_url(data.verification_url),
        "notes": data.notes.strip(), "updated_at": datetime.utcnow(),
    }})
    return {"certification": serialize_certification(certifications_collection.find_one({"_id": cert_id}))}


@app.delete("/api/certifications/{certification_id}")
def remove_certification(certification_id: str, current_user=Depends(get_current_user)):
    cert_id = get_object_id(certification_id)
    record = certifications_collection.find_one({"_id": cert_id})
    if not record:
        raise HTTPException(status_code=404, detail="Certification not found.")
    if record.get("user_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="You can only remove your own certifications.")
    proof = record.get("proof") or {}
    if proof.get("storage_name"):
        stored_path = PRIVATE_UPLOAD_DIR / proof["storage_name"]
        if stored_path.parent == PRIVATE_UPLOAD_DIR and stored_path.exists():
            stored_path.unlink()
    certifications_collection.delete_one({"_id": cert_id})
    return {"message": "Certification removed."}


@app.post("/api/certifications/{certification_id}/proof")
async def upload_certification_proof(certification_id: str, file: UploadFile = File(...), current_user=Depends(get_current_user)):
    cert_id = get_object_id(certification_id)
    record = certifications_collection.find_one({"_id": cert_id})
    if not record:
        raise HTTPException(status_code=404, detail="Certification not found.")
    if record.get("user_id") != current_user["_id"]:
        raise HTTPException(status_code=403, detail="You can only upload proof for your own certification.")
    extension = Path(file.filename or "").suffix.lower()
    expected = PROOF_TYPES.get(extension)
    if not expected:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and PDF proof files are allowed.")
    content = await file.read(MAX_CERTIFICATE_BYTES + 1)
    if len(content) > MAX_CERTIFICATE_BYTES:
        raise HTTPException(status_code=413, detail="Proof files must be 10 MB or smaller.")
    expected_mime, signature_check = expected
    if file.content_type != expected_mime or not signature_check(content):
        raise HTTPException(status_code=400, detail="The file content does not match its allowed image or PDF type.")
    PRIVATE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    storage_name = f"{uuid4().hex}{extension}"
    stored_path = PRIVATE_UPLOAD_DIR / storage_name
    stored_path.write_bytes(content)
    proof = {"storage_name": storage_name, "original_name": Path(file.filename or "proof").name[:180],
             "content_type": expected_mime, "size_bytes": len(content), "uploaded_at": datetime.utcnow()}
    old_proof = record.get("proof") or {}
    certifications_collection.update_one({"_id": cert_id}, {"$set": {"proof": proof, "updated_at": datetime.utcnow()}})
    if old_proof.get("storage_name"):
        old_path = PRIVATE_UPLOAD_DIR / old_proof["storage_name"]
        if old_path.parent == PRIVATE_UPLOAD_DIR and old_path.exists():
            old_path.unlink()
    return {"proof": {"original_name": proof["original_name"], "content_type": expected_mime, "size_bytes": len(content)}}


@app.get("/api/certifications/{certification_id}/proof")
def get_certification_proof(certification_id: str, current_user=Depends(get_current_user)):
    cert_id = get_object_id(certification_id)
    record = certifications_collection.find_one({"_id": cert_id})
    if not record:
        raise HTTPException(status_code=404, detail="Certification not found.")
    owner_or_admin(record, current_user)
    proof = record.get("proof") or {}
    storage_name = proof.get("storage_name", "")
    if not storage_name or Path(storage_name).name != storage_name:
        raise HTTPException(status_code=404, detail="No proof file is available.")
    stored_path = PRIVATE_UPLOAD_DIR / storage_name
    if not stored_path.is_file():
        raise HTTPException(status_code=404, detail="Proof file is missing.")
    return FileResponse(stored_path, media_type=proof.get("content_type", "application/octet-stream"),
                        filename=proof.get("original_name", "certification-proof"), content_disposition_type="inline")


@app.get("/api/admin/certifications")
def list_admin_certifications(_admin=Depends(get_current_user)):
    require_admin_user(_admin)
    records = certifications_collection.find().sort("created_at", -1)
    certifications = []
    for item in records:
        serialized = serialize_certification(item)
        profile = profiles_collection.find_one({"user_id": item["user_id"]}) or {}
        serialized["employee_name"] = profile.get("full_name", "Employee")
        serialized["employee_email"] = profile.get("email", "")
        certifications.append(serialized)
    return {"certifications": certifications}


class CertificationReview(BaseModel):
    verification_status: str


@app.patch("/api/admin/certifications/{certification_id}/review")
def review_certification(certification_id: str, data: CertificationReview, admin=Depends(get_current_user)):
    require_admin_user(admin)
    if data.verification_status not in {"verified", "rejected", "submitted"}:
        raise HTTPException(status_code=400, detail="Choose submitted, verified, or rejected.")
    cert_id = get_object_id(certification_id)
    result = certifications_collection.update_one({"_id": cert_id}, {"$set": {
        "verification_status": data.verification_status, "reviewed_by": admin["_id"], "updated_at": datetime.utcnow(),
    }})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Certification not found.")
    return {"message": "Certification review saved."}


# ============================================================
# ADMIN SKILL MATCHING
# ============================================================

class SkillMatchRequest(BaseModel):
    required_skills: list[str]


@app.post("/api/skill-matches")
def skill_matches(data: SkillMatchRequest, admin=Depends(get_current_user)):
    require_admin_user(admin)
    required = list(dict.fromkeys(skill.strip().casefold() for skill in data.required_skills if skill.strip()))
    if not required:
        raise HTTPException(status_code=400, detail="Add at least one required skill.")
    results = []
    for employee in users_collection.find({"role": "employee", "is_active": {"$ne": False}}, {"password": 0}):
        records = list(skills_collection.find({"user_id": employee["_id"]}))
        by_name = {str(item.get("skill_name", "")).strip().casefold(): item for item in records}
        matched = [name for name in required if name in by_name]
        missing = [name for name in required if name not in by_name]
        profile = profiles_collection.find_one({"user_id": employee["_id"]}) or {}
        results.append({
            "id": str(employee["_id"]), "full_name": employee.get("full_name", ""),
            "email": employee.get("email", ""), "department": profile.get("department", ""),
            "job_title": profile.get("job_title", ""), "teams_link": profile.get("teams_link", ""),
            "matched_skills": matched, "missing_skills": missing,
            "match_count": len(matched), "required_count": len(required),
            "score": round(len(matched) * 100 / len(required)),
        })
    results.sort(key=lambda item: (-item["score"], item["full_name"].casefold()))
    return {"required_skills": required, "results": results, "score_note": "Skill coverage only; it is not a guarantee of suitability."}


# ============================================================
# SEARCH PEOPLE
# ============================================================

@app.get("/api/search/people")
def search_people(
    skill: str = Query(...)
, current_user=Depends(get_current_user)
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

        person = {
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
            }
        if current_user.get("role") == "admin" or str(user_id) == str(current_user["_id"]):
            person["email"] = user.get("email", "")
            person["bio"] = profile.get("bio", "") if profile else ""
            person["projects"] = [serialize_document(project) for project in person_projects]
        else:
            person.pop("email", None)
            person.pop("bio", None)
        people.append(person)

    return {
        "people": people,
        "total": len(people)
    }


# ============================================================
# EMPLOYEES
# ============================================================

@app.get("/api/employees")
def get_employees(current_user=Depends(get_current_user)):

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

        employee = {
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
            }
        if current_user.get("role") == "admin" or str(user_id) == str(current_user["_id"]):
            employee["email"] = user.get("email", "")
            employee["bio"] = profile.get("bio", "") if profile else ""
            employee["projects"] = [serialize_document(project) for project in employee_projects]
        else:
            employee.pop("email", None)
            employee.pop("bio", None)
        employees.append(employee)

    return {
        "employees": employees,
        "total": len(employees)
    }


# ============================================================
# GRAPH DATA
# ============================================================

@app.get("/api/graph")
def get_graph_data(current_user=Depends(get_current_user)):

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
                **({"email": user.get("email", "")} if current_user.get("role") == "admin" or user_id == str(current_user["_id"]) else {})
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
