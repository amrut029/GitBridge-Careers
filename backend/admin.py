from fastapi import APIRouter, HTTPException, Header, Body
from dashboard import require_roles
from database import get_users_collection, get_opportunities_collection, get_applications_collection, get_sync_logs_collection
from bson import ObjectId
from datetime import datetime
import re
from urllib.parse import urlparse
router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)

@router.get("/dashboard")
def get_admin_dashboard(
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["admin"])(authorization or x_auth_token)
    
    users_col = get_users_collection()
    opp_col = get_opportunities_collection()
    app_col = get_applications_collection()
    sync_col = get_sync_logs_collection()
    
    if any(col is None for col in (users_col, opp_col, app_col, sync_col)):
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    total_students = users_col.count_documents({"role": "student"})
    total_recruiters = users_col.count_documents({"role": "recruiter"})
    pending_recruiters = users_col.count_documents({"role": "recruiter", "recruiter_status": "pending"})
    total_opportunities = opp_col.count_documents({})
    active_opportunities = opp_col.count_documents({"is_active": True})
    total_applications = app_col.count_documents({})
    
    return {
        "stats": {
            "total_students": total_students,
            "total_recruiters": total_recruiters,
            "pending_recruiters": pending_recruiters,
            "total_opportunities": total_opportunities,
            "active_opportunities": active_opportunities,
            "total_applications": total_applications
        }
    }

@router.get("/recruiters")
def get_recruiters(
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["admin"])(authorization or x_auth_token)
    users_col = get_users_collection()
    
    recruiters = list(users_col.find({"role": "recruiter"}))
    for r in recruiters:
        r["id"] = str(r["_id"])
        del r["_id"]
        if "password" in r:
            del r["password"]
            
    return {"recruiters": recruiters}

@router.patch("/recruiters/{recruiter_id}/status")
def update_recruiter_status(
    recruiter_id: str,
    payload: dict = Body(...),
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["admin"])(authorization or x_auth_token)
    users_col = get_users_collection()
    
    status = payload.get("status")
    if status == "verified":
        status = "approved"
    if status not in ["approved", "rejected", "pending", "suspended"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    try:
        users_col.update_one(
            {"_id": ObjectId(recruiter_id), "role": "recruiter"},
            {"$set": {"recruiter_status": status, "updated_at": datetime.utcnow().isoformat()}}
        )
        # Send notification to recruiter
        notif = {
            "id": f"admin_rec_{int(datetime.utcnow().timestamp())}",
            "title": f"Account Status: {status.capitalize()} 🛡️",
            "message": f"Your recruiter account has been set to '{status}' by an administrator.",
            "time": datetime.utcnow().isoformat(),
            "read": False
        }
        users_col.update_one(
            {"_id": ObjectId(recruiter_id)},
            {"$push": {"notifications": {"$each": [notif], "$position": 0, "$slice": 20}}}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    return {"message": f"Recruiter status updated to {status}", "status": status}

# =========================================================
# TELEMETRY & METRICS
# =========================================================
@router.get("/metrics")
def get_admin_metrics(
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)
    users_col = get_users_collection()
    opp_col = get_opportunities_collection()

    total_candidates = users_col.count_documents({"role": "student"}) if users_col is not None else 0
    google_logins = users_col.count_documents({"provider": "google"}) if users_col is not None else 0
    email_logins = users_col.count_documents({"provider": "email"}) if users_col is not None else 0
    resumes_uploaded = users_col.count_documents({"resume": {"$exists": True, "$ne": None}}) if users_col is not None else 0
    github_analyzed = users_col.count_documents({"github_username": {"$exists": True, "$ne": None}}) if users_col is not None else 0
    users_with_2fa = users_col.count_documents({"two_factor_enabled": True}) if users_col is not None else 0

    from database import get_database
    db = get_database()
    tickets_col = db["support_tickets"] if db is not None else None
    act_col = db["activities"] if db is not None else None

    inquiries_count = tickets_col.count_documents({}) if tickets_col is not None else 0
    total_activities = act_col.count_documents({}) if act_col is not None else 0

    return {
        "total_candidates": total_candidates,
        "google_logins": google_logins,
        "email_logins": email_logins,
        "resumes_uploaded": resumes_uploaded,
        "github_analyzed": github_analyzed,
        "users_with_2fa": users_with_2fa,
        "total_activities": total_activities,
        "inquiries_count": inquiries_count,
        "database_connected": True
    }

# =========================================================
# USERS & CANDIDATES DIRECTORY
# =========================================================
@router.get("/users")
def get_admin_users(
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)
    users_col = get_users_collection()
    if users_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    users = []
    for u in users_col.find().sort("created_at", -1).limit(300):
        users.append({
            "id": str(u["_id"]),
            "name": u.get("name") or u.get("email", "").split("@")[0],
            "email": u.get("email"),
            "provider": u.get("provider", "email"),
            "role": u.get("role", "student"),
            "github_username": u.get("github_username") or (u.get("github", {}).get("username") if isinstance(u.get("github"), dict) else ""),
            "theme": u.get("theme", "classic"),
            "language": u.get("language", "en"),
            "two_factor_enabled": bool(u.get("two_factor_enabled")),
            "sound_enabled": bool(u.get("sound_enabled", True)),
            "profile_strength": u.get("profile_strength", 65),
            "has_resume": bool(u.get("resume")),
            "last_action": u.get("last_action", "Registered on platform"),
            "last_active": u.get("last_active") or (u.get("created_at").isoformat() if isinstance(u.get("created_at"), datetime) else None),
            "created_at": u.get("created_at").isoformat() if isinstance(u.get("created_at"), datetime) else str(u.get("created_at", ""))
        })
    return {"users": users}

@router.delete("/users/{user_id}")
def delete_admin_user(
    user_id: str,
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)
    users_col = get_users_collection()
    if users_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        user_to_delete = users_col.find_one({"_id": ObjectId(user_id)})
        if not user_to_delete:
            raise HTTPException(status_code=404, detail="User not found")
        if user_to_delete.get("email") == "admin@gitbridge.com":
            raise HTTPException(status_code=400, detail="Master admin cannot be deleted")
        users_col.delete_one({"_id": ObjectId(user_id)})
        return {"message": "User deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail="Invalid user ID")

# =========================================================
# SUPPORT TICKETS
# =========================================================
@router.get("/tickets")
def get_admin_tickets(
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)
    from database import get_database
    db = get_database()
    tickets_col = db["support_tickets"] if db is not None else None
    if tickets_col is None:
        return {"tickets": []}

    tickets = []
    for t in tickets_col.find().sort("created_at", -1).limit(100):
        tickets.append({
            "id": str(t["_id"]),
            "name": t.get("name", "Student"),
            "email": t.get("email", ""),
            "subject": t.get("subject", "General Inquiry"),
            "message": t.get("message", ""),
            "status": t.get("status", "open"),
            "created_at": t.get("created_at").isoformat() if isinstance(t.get("created_at"), datetime) else str(t.get("created_at", ""))
        })
    return {"tickets": tickets}

# =========================================================
# ACTIVITY AUDIT STREAM
# =========================================================
@router.get("/activities")
def get_admin_activities(
    limit: int = 200,
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)
    from database import get_database
    db = get_database()
    act_col = db["activities"] if db is not None else None
    if act_col is None:
        return {"activities": []}

    activities = []
    for a in act_col.find().sort("timestamp", -1).limit(limit):
        activities.append({
            "id": str(a["_id"]),
            "user_id": str(a.get("user_id", "")),
            "user_email": a.get("user_email", ""),
            "user_name": a.get("user_name", "Student"),
            "action_type": a.get("action_type", "LOGIN"),
            "action_title": a.get("action_title", "User Activity"),
            "details": a.get("details", {}),
            "created_at": a.get("created_at") or (a.get("timestamp").isoformat() if isinstance(a.get("timestamp"), datetime) else str(a.get("timestamp", "")))
        })
    return {"activities": activities}

# =========================================================
# REALTIME JOBS TRIGGER
# =========================================================
@router.post("/opportunities/fetch-realtime")
def fetch_realtime_opportunities(
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)
    from sync_service import fetch_and_sync_live_market_jobs
    res = fetch_and_sync_live_market_jobs(limit=30)
    return {"message": f"Successfully fetched live openings: {res.get('jobs_synced', 0)} jobs updated."}

@router.get("/sync-logs")
def get_sync_logs(
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["admin"])(authorization or x_auth_token)
    sync_col = get_sync_logs_collection()
    
    logs = list(sync_col.find().sort("started_at", -1).limit(50))
    for log in logs:
        log["id"] = str(log["_id"])
        del log["_id"]
        
    return {"sync_logs": logs}

@router.post("/sync-live")
def trigger_admin_sync_live(
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)
    from sync_service import fetch_and_sync_live_market_jobs
    return fetch_and_sync_live_market_jobs(limit=50)

@router.get("/students")
def get_admin_students(
    q: str = None,
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)
    users_col = get_users_collection()
    if users_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    query = {"role": "student"}
    if q and q.strip():
        search = re.escape(q.strip())
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"target_role": {"$regex": search, "$options": "i"}}
        ]

    students = []
    for s in users_col.find(query).sort("created_at", -1).limit(200):
        students.append({
            "id": str(s["_id"]),
            "name": s.get("name") or s.get("email", "").split("@")[0],
            "email": s.get("email"),
            "role": s.get("role", "student"),
            "target_role": s.get("target_role", ""),
            "location_pref": s.get("location_pref", ""),
            "has_github": bool(s.get("github")),
            "has_resume": bool(s.get("resume")),
            "ats_score": s.get("resume", {}).get("ats_score") if s.get("resume") else None,
            "created_at": s.get("created_at").isoformat() if isinstance(s.get("created_at"), datetime) else s.get("created_at")
        })

    return {"students": students, "total": len(students)}

# =========================================================
# ADMIN OPPORTUNITIES MANAGEMENT
# =========================================================

def serialize_opportunity(opp):
    data = dict(opp)
    data["id"] = str(data.pop("_id"))

    for field in ["created_at", "updated_at", "deadline"]:
        if isinstance(data.get(field), datetime):
            data[field] = data[field].isoformat()

    return data


def get_admin_opportunity(opp_col, opportunity_id):
    if ObjectId.is_valid(opportunity_id):
        return opp_col.find_one({"_id": ObjectId(opportunity_id)})

    return opp_col.find_one({"source_id": opportunity_id})


def validate_opportunity_payload(payload, partial=False):
    allowed_fields = {
        "title", "company", "description", "required_skills",
        "location", "type", "apply_url", "deadline",
        "domain", "stipend", "level", "assigned_recruiter_id"
    }

    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Invalid request body")

    data = {
        key: value
        for key, value in payload.items()
        if key in allowed_fields
    }

    if not partial:
        required = ["title", "company", "description", "location", "type"]
        missing = [
            field for field in required
            if not str(data.get(field, "")).strip()
        ]

        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Required fields missing: {', '.join(missing)}"
            )

    for field in ["title", "company", "description", "location", "type"]:
        if field in data:
            if not isinstance(data[field], str) or not data[field].strip():
                raise HTTPException(
                    status_code=400,
                    detail=f"{field} must be a non-empty string"
                )
            data[field] = data[field].strip()

    if "required_skills" in data:
        skills = data["required_skills"]

        if isinstance(skills, str):
            skills = skills.split(",")

        if not isinstance(skills, list):
            raise HTTPException(
                status_code=400,
                detail="Required skills must be a list"
            )

        data["required_skills"] = [
            str(skill).strip()
            for skill in skills
            if str(skill).strip()
        ]

    if "apply_url" in data:
        url = str(data["apply_url"]).strip()

        if url:
            parsed = urlparse(url)

            if parsed.scheme not in ["http", "https"] or not parsed.netloc:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid application URL"
                )

        data["apply_url"] = url

    return data


# GET ALL OPPORTUNITIES
@router.get("/opportunities")
def get_admin_opportunities(
    q: str = None,
    status: str = "all",
    opportunity_type: str = None,
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)

    opp_col = get_opportunities_collection()

    if opp_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    query = {}

    if status == "active":
        query["is_active"] = True
    elif status == "inactive":
        query["is_active"] = False
    elif status != "all":
        raise HTTPException(status_code=400, detail="Invalid status filter")

    if opportunity_type and opportunity_type != "all":
        query["type"] = {
            "$regex": f"^{re.escape(opportunity_type)}$",
            "$options": "i"
        }

    if q and q.strip():
        search = re.escape(q.strip())

        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"required_skills": {"$regex": search, "$options": "i"}}
        ]

    opportunities = [
        serialize_opportunity(opp)
        for opp in opp_col.find(query).sort("created_at", -1).limit(500)
    ]

    return {
        "opportunities": opportunities,
        "total": len(opportunities)
    }


# CREATE OPPORTUNITY
@router.post("/opportunities")
def create_admin_opportunity(
    payload: dict = Body(...),
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    admin = require_roles(["admin"])(authorization or x_auth_token)

    opp_col = get_opportunities_collection()

    if opp_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    data = validate_opportunity_payload(payload)

    data.update({
        "source": "gitbridge_admin",
        "source_type": "admin",
        "is_active": True,
        "created_by": str(admin["_id"]),
        "created_at": datetime.utcnow()
    })

    result = opp_col.insert_one(data)
    created = opp_col.find_one({"_id": result.inserted_id})

    return {
        "message": "Opportunity created successfully",
        "opportunity": serialize_opportunity(created)
    }


# UPDATE OPPORTUNITY
@router.put("/opportunities/{opportunity_id}")
def update_admin_opportunity(
    opportunity_id: str,
    payload: dict = Body(...),
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)

    opp_col = get_opportunities_collection()

    if opp_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    existing = get_admin_opportunity(opp_col, opportunity_id)

    if not existing:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    data = validate_opportunity_payload(payload, partial=True)

    if not data:
        raise HTTPException(status_code=400, detail="No valid fields provided")

    data["updated_at"] = datetime.utcnow()

    opp_col.update_one(
        {"_id": existing["_id"]},
        {"$set": data}
    )

    updated = opp_col.find_one({"_id": existing["_id"]})

    return {
        "message": "Opportunity updated successfully",
        "opportunity": serialize_opportunity(updated)
    }


# ACTIVATE / DEACTIVATE
@router.patch("/opportunities/{opportunity_id}/status")
def update_opportunity_status(
    opportunity_id: str,
    payload: dict = Body(...),
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)

    opp_col = get_opportunities_collection()

    if opp_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    is_active = payload.get("is_active")

    if not isinstance(is_active, bool):
        raise HTTPException(
            status_code=400,
            detail="is_active must be true or false"
        )

    existing = get_admin_opportunity(opp_col, opportunity_id)

    if not existing:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    opp_col.update_one(
        {"_id": existing["_id"]},
        {
            "$set": {
                "is_active": is_active,
                "updated_at": datetime.utcnow()
            }
        }
    )

    return {
        "message": "Opportunity status updated successfully",
        "is_active": is_active
    }


# DELETE OPPORTUNITY
@router.delete("/opportunities/{opportunity_id}")
def delete_admin_opportunity(
    opportunity_id: str,
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)

    opp_col = get_opportunities_collection()
    app_col = get_applications_collection()

    if opp_col is None or app_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    existing = get_admin_opportunity(opp_col, opportunity_id)

    if not existing:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    stored_id = str(existing["_id"])

    application_query = {
        "opportunity_id": stored_id
    }

    if existing.get("source_id"):
        application_query = {
            "$or": [
                {"opportunity_id": stored_id},
                {"opportunity_id": existing["source_id"]}
            ]
        }

    linked_applications = app_col.count_documents(application_query)

    if linked_applications > 0:
        raise HTTPException(
            status_code=409,
            detail=(
                f"This opportunity has {linked_applications} linked applications. "
                "Deactivate it instead to preserve application history."
            )
        )

    opp_col.delete_one({"_id": existing["_id"]})

    return {
        "message": "Opportunity deleted successfully",
        "deleted_id": stored_id
    }

    # =========================================================
# ADMIN APPLICATIONS MANAGEMENT
# =========================================================

def serialize_admin_application(app, users_col, opp_col):
    app_id = str(app.get("_id", ""))
    student_id = str(app.get("student_id") or app.get("user_id") or "")
    opportunity_id = str(app.get("opportunity_id") or "")

    # Find student using Mongo ObjectId or string-based references.
    student = app.get("student") if isinstance(app.get("student"), dict) else None
    if not student and users_col is not None and student_id:
        student_queries = []
        if ObjectId.is_valid(student_id):
            student_queries.append({"_id": ObjectId(student_id)})
        student_queries.extend([
            {"_id": student_id},
            {"id": student_id},
            {"user_id": student_id},
        ])
        for student_query in student_queries:
            student = users_col.find_one(student_query)
            if student:
                break

    # Find opportunity using Mongo ObjectId, string ID, or source ID.
    opportunity = (
        app.get("opportunity")
        if isinstance(app.get("opportunity"), dict)
        else None
    )
    if not opportunity and opp_col is not None and opportunity_id:
        opportunity_queries = []
        if ObjectId.is_valid(opportunity_id):
            opportunity_queries.append({"_id": ObjectId(opportunity_id)})
        opportunity_queries.extend([
            {"_id": opportunity_id},
            {"id": opportunity_id},
            {"source_id": opportunity_id},
        ])
        for opportunity_query in opportunity_queries:
            opportunity = opp_col.find_one(opportunity_query)
            if opportunity:
                break

    student = student or {}
    opportunity = opportunity or {}

    def format_date(value):
        return value.isoformat() if isinstance(value, datetime) else value

    return {
        "id": app_id,
        "student_id": student_id,
        "student": {
            "name": (
                student.get("name")
                or student.get("full_name")
                or student.get("username")
                or "Unknown Student"
            ),
            "email": student.get("email", ""),
        },
        "opportunity_id": opportunity_id,
        "opportunity": {
            "title": opportunity.get("title", "Opportunity unavailable"),
            "company": opportunity.get("company", ""),
            "location": opportunity.get("location", ""),
        },
        "application_type": app.get("application_type", "unknown"),
        "status": app.get("status", "Applied"),
        "applied_at": format_date(app.get("applied_at")),
        "updated_at": format_date(app.get("updated_at")),
        "redirected_at": format_date(app.get("redirected_at")),
        "confirmed_at": format_date(app.get("confirmed_at")),
    }


@router.get("/applications")
def get_admin_applications(
    q: str = None,
    status: str = None,
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)

    app_col = get_applications_collection()
    users_col = get_users_collection()
    opp_col = get_opportunities_collection()

    if app_col is None or users_col is None or opp_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    query = {}
    if status and status.lower() != "all":
        query["status"] = status

    applications = []
    for app in app_col.find(query).sort("applied_at", -1).limit(500):
        applications.append(
            serialize_admin_application(app, users_col, opp_col)
        )

    if q:
        search = q.strip().lower()
        applications = [
            app for app in applications
            if search in str(app["student"]["name"]).lower()
            or search in str(app["student"]["email"]).lower()
            or search in str(app["opportunity"]["title"]).lower()
            or search in str(app["opportunity"]["company"]).lower()
        ]

    return {
        "applications": applications,
        "total": len(applications)
    }


@router.patch("/applications/{application_id}/status")
def update_admin_application_status(
    application_id: str,
    payload: dict = Body(...),
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    require_roles(["admin"])(authorization or x_auth_token)

    app_col = get_applications_collection()
    if app_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        app = app_col.find_one({"_id": ObjectId(application_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid application ID")

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    new_status = payload.get("status")
    allowed_statuses = [
        "Applied",
        "Under Review",
        "Reviewing",
        "Shortlisted",
        "Interview",
        "Selected",
        "Rejected"
    ]

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of: {', '.join(allowed_statuses)}"
        )

    updated_at = datetime.utcnow().isoformat()
    app_col.update_one(
        {"_id": app["_id"]},
        {"$set": {"status": new_status, "updated_at": updated_at}}
    )

    # Send real-time notification to student
    if app.get("user_id"):
        users_col = get_users_collection()
        if users_col is not None:
            notif = {
                "id": f"admin_app_{int(datetime.utcnow().timestamp())}",
                "title": f"Application Status: {new_status}!",
                "message": f"Your application status has been updated to '{new_status}' by an administrator.",
                "time": datetime.utcnow().isoformat(),
                "read": False
            }
            users_col.update_one(
                {"_id": app["user_id"]},
                {"$push": {"notifications": {"$each": [notif], "$position": 0, "$slice": 20}}}
            )

    return {
        "message": "Application status updated successfully",
        "application_id": application_id,
        "status": new_status
    }