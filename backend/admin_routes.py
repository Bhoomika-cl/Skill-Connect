from datetime import datetime
from hashlib import sha256

from bson import ObjectId
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from pydantic import BaseModel
import bcrypt

from database import (
    audit_collection,
    certifications_collection,
    profiles_collection,
    projects_collection,
    sessions_collection,
    skills_collection,
    tasks_collection,
    users_collection,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(request: Request, authorization: str | None = Header(default=None)):
    # The frontend uses an HttpOnly session cookie. Keep bearer-token support
    # for API clients, but accept the same cookie session used by other routes.
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
    else:
        token = request.cookies.get("skillconnect_session", "")
    if not token:
        raise HTTPException(status_code=401, detail="Please sign in again.")
    session = sessions_collection.find_one({
        "token_hash": sha256(token.encode("utf-8")).hexdigest(),
        "expires_at": {"$gt": datetime.utcnow()},
    })
    if not session:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")

    user = users_collection.find_one({"_id": session["user_id"]})
    if not user or user.get("is_active", True) is False:
        raise HTTPException(status_code=401, detail="This account is inactive.")
    if user.get("role", "employee") != "admin":
        raise HTTPException(status_code=403, detail="Admin access is required.")
    return user


class StatusUpdate(BaseModel):
    is_active: bool


class RoleUpdate(BaseModel):
    role: str


class EmployeeCreate(BaseModel):
    full_name: str
    username: str
    email: str
    password: str
    department: str = ""
    job_title: str = ""


class EmployeeUpdate(BaseModel):
    full_name: str
    email: str
    department: str = ""
    job_title: str = ""
    bio: str = ""


class ProjectUpdate(BaseModel):
    user_id: str
    project_name: str
    description: str = ""
    skills_used: list[str] = []


def write_audit(actor, action, target_id):
    audit_collection.insert_one({
        "actor_id": actor["_id"],
        "actor_username": actor.get("username", ""),
        "action": action,
        "target_id": str(target_id),
        "created_at": datetime.utcnow(),
    })


@router.post("/employees")
def create_employee(data: EmployeeCreate, admin=Depends(require_admin)):
    username = data.username.strip()
    email = data.email.strip().lower()
    if not username or not data.full_name.strip():
        raise HTTPException(status_code=400, detail="Name and username are required.")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Temporary password must contain at least 8 characters.")
    if users_collection.find_one({"$or": [{"username": username}, {"email": email}]}):
        raise HTTPException(status_code=409, detail="That username or email is already in use.")
    now = datetime.utcnow()
    result = users_collection.insert_one({
        "full_name": data.full_name.strip(), "username": username,
        "email": email,
        "password": bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
        "role": "employee", "is_active": True, "created_at": now,
    })
    profiles_collection.insert_one({
        "user_id": result.inserted_id, "full_name": data.full_name.strip(),
        "username": username, "email": email, "department": data.department.strip(),
        "job_title": data.job_title.strip(), "bio": "", "created_at": now, "updated_at": now,
    })
    write_audit(admin, "employee_created", result.inserted_id)
    return {"message": "Employee account created.", "id": str(result.inserted_id)}


@router.put("/employees/{user_id}")
def edit_employee(user_id: str, data: EmployeeUpdate, admin=Depends(require_admin)):
    try:
        target_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid employee ID.")
    if not users_collection.find_one({"_id": target_id}):
        raise HTTPException(status_code=404, detail="Employee not found.")
    email = data.email.strip().lower()
    if users_collection.find_one({"email": email, "_id": {"$ne": target_id}}):
        raise HTTPException(status_code=409, detail="That email is already in use.")
    profile_update = {
        "full_name": data.full_name.strip(), "email": email,
        "department": data.department.strip(), "job_title": data.job_title.strip(),
        "bio": data.bio.strip(), "updated_at": datetime.utcnow(),
    }
    users_collection.update_one({"_id": target_id}, {"$set": {"full_name": data.full_name.strip(), "email": email}})
    profiles_collection.update_one({"user_id": target_id}, {"$set": profile_update}, upsert=True)
    write_audit(admin, "employee_updated", target_id)
    return {"message": "Employee details updated."}


@router.get("/overview")
def admin_overview(_admin=Depends(require_admin)):
    return _overview()


def _overview():
    task_statuses = {
        status: tasks_collection.count_documents({"status": status})
        for status in ("todo", "in_progress", "blocked", "done")
    }
    return {
        "accounts": users_collection.count_documents({}),
        "employees": users_collection.count_documents({"role": "employee"}),
        "active_accounts": users_collection.count_documents({"is_active": {"$ne": False}}),
        "active_employees": users_collection.count_documents({"role": "employee", "is_active": {"$ne": False}}),
        "admins": users_collection.count_documents({"role": "admin", "is_active": {"$ne": False}}),
        "skills": skills_collection.count_documents({}),
        "projects": projects_collection.count_documents({}),
        "tasks": sum(task_statuses.values()),
        "task_statuses": task_statuses,
        "pending_certifications": certifications_collection.count_documents({"verification_status": "submitted"}),
        "verified_certifications": certifications_collection.count_documents({"verification_status": "verified"}),
        "rejected_certifications": certifications_collection.count_documents({"verification_status": "rejected"}),
        "certifications": certifications_collection.count_documents({}),
    }


@router.get("/discover")
def discover_records(
    q: str = Query(default="", max_length=120),
    result_type: str = Query(default="all", alias="type"),
    department: str = Query(default="", max_length=120),
    sort_by: str = Query(default="relevance", alias="sort"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _admin=Depends(require_admin),
):
    allowed_types = {"all", "employees", "skills", "projects", "certifications"}
    if result_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Choose a valid discovery category.")
    if sort_by not in {"relevance", "name", "recent"}:
        raise HTTPException(status_code=400, detail="Choose relevance, name, or recent sorting.")

    query = q.strip().casefold()
    department_filter = department.strip().casefold()
    all_accounts = list(users_collection.find({}, {"password": 0}))
    users = [user for user in all_accounts if user.get("role", "employee") == "employee" and user.get("is_active", True) is not False]
    profiles = {str(profile["user_id"]): profile for profile in profiles_collection.find({})}
    user_by_id = {str(user["_id"]): user for user in all_accounts}
    items = []
    departments = set()

    def matches(text):
        return not query or query in str(text or "").casefold()

    def make_item(kind, record_id, title, subtitle, detail, owner_id=None, search_text="", updated_at=None, extra=None):
        owner_profile = profiles.get(str(owner_id), {}) if owner_id else {}
        owner_user = user_by_id.get(str(owner_id), {}) if owner_id else {}
        owner_department = owner_profile.get("department", "")
        if owner_department:
            departments.add(owner_department)
        if department_filter and department_filter not in owner_department.casefold():
            return
        corpus = " ".join([title, subtitle, detail, search_text, owner_profile.get("full_name", ""), owner_user.get("full_name", ""), owner_department])
        if not matches(corpus):
            return
        score = 0
        if query:
            fields = [title, subtitle, owner_user.get("full_name", ""), owner_department, search_text, detail]
            score = sum((100 - index) for field in fields if query in str(field or "").casefold() for index in [str(field or "").casefold().find(query)] if index >= 0)
        items.append({
            "id": str(record_id), "type": kind, "title": title or "Untitled",
            "subtitle": subtitle, "detail": detail, "department": owner_department,
            "employee_id": str(owner_id) if owner_id else "", "employee_name": owner_user.get("full_name", owner_profile.get("full_name", "")),
            "updated_at": updated_at.isoformat() if hasattr(updated_at, "isoformat") else "",
            "score": score, **(extra or {}),
        })

    if result_type in {"all", "employees"}:
        for user in users:
            uid = user["_id"]
            profile = profiles.get(str(uid), {})
            user_skills = list(skills_collection.find({"user_id": uid}, {"skill_name": 1, "category": 1}))
            skill_names = [item.get("skill_name", "") for item in user_skills if item.get("skill_name")]
            make_item("employee", uid, user.get("full_name") or user.get("username", "Employee"),
                      profile.get("job_title", ""), profile.get("bio", ""), uid,
                      " ".join([user.get("username", ""), " ".join(skill_names)]), profile.get("updated_at"),
                      {"username": user.get("username", ""), "skills": skill_names})

    if result_type in {"all", "skills"}:
        for skill in skills_collection.find({}):
            uid = skill.get("user_id")
            user = user_by_id.get(str(uid), {})
            if not user:
                continue
            name = skill.get("skill_name", "")
            make_item("skill", skill["_id"], name, skill.get("proficiency", ""), skill.get("category", ""), uid,
                      " ".join([skill.get("category", ""), skill.get("proficiency", ""), str(skill.get("years_experience", ""))]),
                      skill.get("created_at"), {"proficiency": skill.get("proficiency", ""), "category": skill.get("category", ""), "years_experience": skill.get("years_experience", 0)})

    if result_type in {"all", "projects"}:
        for project in projects_collection.find({}):
            uid = project.get("user_id")
            if str(uid) not in user_by_id:
                continue
            skills_used = project.get("skills_used", [])
            make_item("project", project["_id"], project.get("project_name", "Project"),
                      user_by_id[str(uid)].get("full_name", "Employee"), project.get("description", ""), uid,
                      " ".join(str(skill) for skill in skills_used), project.get("created_at"),
                      {"skills_used": skills_used})

    if result_type in {"all", "certifications"}:
        for cert in certifications_collection.find({}):
            uid = cert.get("user_id")
            if str(uid) not in user_by_id:
                continue
            make_item("certification", cert["_id"], cert.get("name", "Certification"),
                      user_by_id[str(uid)].get("full_name", "Employee"), cert.get("issuer", ""), uid,
                      " ".join([cert.get("credential_id", ""), cert.get("notes", ""), cert.get("verification_status", "")]),
                      cert.get("updated_at") or cert.get("created_at"),
                      {"verification_status": cert.get("verification_status", "submitted"), "issue_date": cert.get("issue_date", ""), "expiration_date": cert.get("expiration_date", ""), "has_proof": bool(cert.get("proof"))})

    counts = {kind: sum(1 for item in items if item["type"] == kind) for kind in ("employees", "skills", "projects", "certifications")}
    # Normalize the employee kind name used by the public filter.
    counts["employees"] = sum(1 for item in items if item["type"] == "employee")
    for item in items:
        if item["type"] == "employee":
            item["type"] = "employees"

    if sort_by == "name":
        items.sort(key=lambda item: (item["title"].casefold(), item["type"]))
    elif sort_by == "recent":
        items.sort(key=lambda item: item["updated_at"], reverse=True)
    else:
        items.sort(key=lambda item: (-item["score"], item["title"].casefold(), item["type"]))

    total = len(items)
    start = (page - 1) * page_size
    return {
        "items": items[start:start + page_size],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
        "counts": counts,
        "departments": sorted(departments, key=str.casefold),
    }


@router.put("/projects/{project_id}")
def update_project(project_id: str, data: ProjectUpdate, admin=Depends(require_admin)):
    try:
        project_object_id = ObjectId(project_id)
        user_object_id = ObjectId(data.user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid project or employee ID.")
    if not projects_collection.find_one({"_id": project_object_id}):
        raise HTTPException(status_code=404, detail="Project not found.")
    if not users_collection.find_one({"_id": user_object_id, "role": "employee", "is_active": {"$ne": False}}):
        raise HTTPException(status_code=404, detail="Active employee not found.")
    project_name = data.project_name.strip()
    if not project_name:
        raise HTTPException(status_code=400, detail="Project name is required.")
    projects_collection.update_one({"_id": project_object_id}, {"$set": {
        "user_id": user_object_id, "project_name": project_name,
        "description": data.description.strip(),
        "skills_used": [skill.strip() for skill in data.skills_used if skill.strip()],
        "updated_at": datetime.utcnow(),
    }})
    project = projects_collection.find_one({"_id": project_object_id})
    return {"project": {**{key: value for key, value in project.items() if key != "_id"}, "id": str(project_object_id), "user_id": str(project["user_id"]), "created_at": project.get("created_at").isoformat() if project.get("created_at") else "", "updated_at": project.get("updated_at").isoformat() if project.get("updated_at") else ""}}


@router.get("/employees")
def list_all_employees(_admin=Depends(require_admin)):
    employees = []
    for user in users_collection.find({}, {"password": 0}):
        profile = profiles_collection.find_one({"user_id": user["_id"]}) or {}
        employees.append({
            "id": str(user["_id"]),
            "full_name": user.get("full_name", ""),
            "username": user.get("username", ""),
            "email": user.get("email", ""),
            "department": profile.get("department", ""),
            "job_title": profile.get("job_title", ""),
            "bio": profile.get("bio", ""),
            "teams_link": profile.get("teams_link", ""),
            "role": user.get("role", "employee"),
            "is_active": user.get("is_active", True),
        })
    return employees


@router.patch("/employees/{user_id}/status")
def update_employee_status(user_id: str, data: StatusUpdate, admin=Depends(require_admin)):
    try:
        target_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid employee ID.")

    target = users_collection.find_one({"_id": target_id})
    if not target:
        raise HTTPException(status_code=404, detail="Employee not found.")
    if str(target_id) == str(admin["_id"]) and not data.is_active:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account.")
    if target.get("role") == "admin" and not data.is_active:
        active_admins = users_collection.count_documents({
            "role": "admin", "is_active": {"$ne": False}
        })
        if active_admins <= 1:
            raise HTTPException(status_code=400, detail="At least one active admin must remain.")

    users_collection.update_one({"_id": target_id}, {"$set": {"is_active": data.is_active}})
    write_audit(admin, "employee_activated" if data.is_active else "employee_deactivated", target_id)
    return {"message": "Employee status updated.", "is_active": data.is_active}


@router.patch("/employees/{user_id}/role")
def update_employee_role(user_id: str, data: RoleUpdate, admin=Depends(require_admin)):
    if data.role not in {"admin", "employee"}:
        raise HTTPException(status_code=400, detail="Role must be admin or employee.")
    try:
        target_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid employee ID.")

    target = users_collection.find_one({"_id": target_id})
    if not target:
        raise HTTPException(status_code=404, detail="Employee not found.")
    if str(target_id) == str(admin["_id"]) and data.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot remove your own admin access.")
    if target.get("role") == "admin" and data.role != "admin":
        active_admins = users_collection.count_documents({
            "role": "admin", "is_active": {"$ne": False}
        })
        if active_admins <= 1:
            raise HTTPException(status_code=400, detail="At least one active admin must remain.")

    users_collection.update_one({"_id": target_id}, {"$set": {"role": data.role}})
    write_audit(admin, f"role_changed_to_{data.role}", target_id)
    return {"message": "Employee role updated.", "role": data.role}


@router.get("/audit")
def get_audit_log(_admin=Depends(require_admin)):
    entries = audit_collection.find().sort("created_at", -1).limit(100)
    return [
        {
            "id": str(entry["_id"]),
            "actor": entry.get("actor_username", "Admin"),
            "action": entry.get("action", ""),
            "target_id": entry.get("target_id", ""),
            "created_at": entry.get("created_at", datetime.utcnow()).isoformat(),
        }
        for entry in entries
    ]
