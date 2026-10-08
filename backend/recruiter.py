from fastapi import APIRouter, HTTPException, Header, Body
from dashboard import require_roles, get_current_user
from database import get_opportunities_collection, get_applications_collection, get_users_collection
from match_service import calculate_opportunity_match
from datetime import datetime
from bson import ObjectId
import re

router = APIRouter(
    prefix="/api/recruiter",
    tags=["Recruiter"]
)

# Helper to serialize opportunity
def serialize_recruiter_opp(opp):
    d = dict(opp)
    d["id"] = str(d.pop("_id"))
    for field in ["created_at", "updated_at", "deadline"]:
        if isinstance(d.get(field), datetime):
            d[field] = d[field].isoformat()
    return d


# =========================================================
# RECRUITER PROFILE MANAGEMENT
# =========================================================

@router.get("/profile")
def get_recruiter_profile(
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["recruiter"])(authorization or x_auth_token)
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "company": user.get("company") or user.get("company_name", ""),
        "website": user.get("website", ""),
        "location": user.get("location", ""),
        "phone": user.get("phone", ""),
        "about": user.get("about") or user.get("bio", ""),
        "linkedin": user.get("linkedin", ""),
        "logo": user.get("logo", ""),
        "recruiter_status": user.get("recruiter_status", "pending")
    }


@router.put("/profile")
def update_recruiter_profile(
    payload: dict = Body(...),
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["recruiter"])(authorization or x_auth_token)
    users_col = get_users_collection()
    if users_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    allowed = ["name", "company", "website", "location", "phone", "about", "linkedin", "logo"]
    updates = {k: str(v).strip() for k, v in payload.items() if k in allowed}
    if not updates:
        raise HTTPException(status_code=400, detail="No valid profile fields provided")

    updates["updated_at"] = datetime.utcnow()
    users_col.update_one({"_id": user["_id"]}, {"$set": updates})

    updated_user = users_col.find_one({"_id": user["_id"]})
    return {
        "message": "Profile updated successfully",
        "profile": {
            "id": str(updated_user["_id"]),
            "name": updated_user.get("name", ""),
            "email": updated_user.get("email", ""),
            "company": updated_user.get("company") or updated_user.get("company_name", ""),
            "website": updated_user.get("website", ""),
            "location": updated_user.get("location", ""),
            "phone": updated_user.get("phone", ""),
            "about": updated_user.get("about") or updated_user.get("bio", ""),
            "linkedin": updated_user.get("linkedin", ""),
            "logo": updated_user.get("logo", ""),
            "recruiter_status": updated_user.get("recruiter_status", "pending")
        }
    }


# =========================================================
# RECRUITER NOTIFICATIONS
# =========================================================

@router.get("/notifications")
def get_recruiter_notifications(
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["recruiter"])(authorization or x_auth_token)
    users_col = get_users_collection()
    if users_col is None:
        return {"notifications": []}
    u = users_col.find_one({"_id": user["_id"]})
    return {"notifications": u.get("notifications", []) if u else []}


# =========================================================
# RECRUITER DASHBOARD & APPLICANTS WITH AI MATCHING
# =========================================================

@router.get("/dashboard")
def get_recruiter_dashboard(
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["recruiter"])(authorization or x_auth_token)

    opp_col = get_opportunities_collection()
    app_col = get_applications_collection()
    users_col = get_users_collection()

    if opp_col is None or app_col is None or users_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    recruiter_id = str(user["_id"])

    # Find opportunities created by or assigned to this recruiter
    my_opportunities_raw = list(opp_col.find({
        "$or": [
            {"created_by": recruiter_id},
            {"assigned_recruiter_id": recruiter_id}
        ]
    }).sort("created_at", -1))

    my_opportunities = []
    my_opp_ids = []
    my_opp_map = {}

    for opp in my_opportunities_raw:
        serialized = serialize_recruiter_opp(opp)
        my_opportunities.append(serialized)
        opp_id = serialized["id"]
        my_opp_ids.append(opp_id)
        my_opp_map[opp_id] = serialized

    # Fetch applications for these opportunities
    applications_raw = list(app_col.find({
        "opportunity_id": {"$in": my_opp_ids}
    }).sort("applied_at", -1))

    # Cache student lookups
    student_ids = list({app.get("student_id") for app in applications_raw if app.get("student_id")})
    student_map = {}
    if student_ids:
        object_ids = [ObjectId(sid) for sid in student_ids if ObjectId.is_valid(sid)]
        for s in users_col.find({"_id": {"$in": object_ids}}):
            student_map[str(s["_id"])] = s

    enriched_applications = []
    for app in applications_raw:
        app_id = str(app["_id"])
        opp_id = str(app.get("opportunity_id", ""))
        student_id = str(app.get("student_id", ""))
        
        student = student_map.get(student_id, {})
        opp_info = my_opp_map.get(opp_id, {})

        resume_info = student.get("resume") or {}
        github_info = student.get("github") or {}

        # AI Candidate Matching Engine
        match_analysis = calculate_opportunity_match(resume_info, github_info, opp_info, student)

        enriched_applications.append({
            "id": app_id,
            "opportunity_id": opp_id,
            "opportunity_title": opp_info.get("title", "Opportunity"),
            "opportunity_company": opp_info.get("company", user.get("company", "Company")),
            "student_id": student_id,
            "student_name": student.get("name") or student.get("email", "").split("@")[0] or "Applicant",
            "student_email": student.get("email", ""),
            "student_phone": student.get("phone", ""),
            "target_role": student.get("target_role", ""),
            "skills": resume_info.get("skills", []),
            "ats_score": resume_info.get("ats_score"),
            "resume_filename": resume_info.get("filename"),
            "github_username": github_info.get("username"),
            "application_type": app.get("application_type", "internal"),
            "status": app.get("status", "Applied"),
            "recruiter_notes": app.get("recruiter_notes", ""),
            "applied_at": app.get("applied_at"),
            "updated_at": app.get("updated_at"),
            # Rich AI Match Data
            "match_score": match_analysis.get("overall_match", 75),
            "match_analysis": match_analysis,
            "skills_match": match_analysis.get("skills_match", 75),
            "github_match": match_analysis.get("github_match", 60),
            "resume_match": match_analysis.get("resume_match", 65),
            "experience_match": match_analysis.get("experience_match", 80),
            "recommendation": match_analysis.get("recommendation", "Good Match"),
            "explanation": match_analysis.get("explanation", ""),
            "matched_skills": match_analysis.get("matched_skills", []),
            "missing_skills": match_analysis.get("missing_skills", [])
        })

    active_opps = sum(1 for o in my_opportunities if o.get("is_active") is not False)
    shortlisted_count = sum(1 for a in enriched_applications if a.get("status") in ["Shortlisted", "Selected", "Interview"])
    pending_review = sum(1 for a in enriched_applications if a.get("status") in ["Applied", "Under Review", "Reviewing"])

    # Attach application count to each opportunity
    app_count_map = {}
    for a in enriched_applications:
        oid = a.get("opportunity_id")
        app_count_map[oid] = app_count_map.get(oid, 0) + 1
    for o in my_opportunities:
        o["applications_count"] = app_count_map.get(o["id"], 0)

    return {
        "status": user.get("recruiter_status", "pending"),
        "company": user.get("company") or user.get("company_name", ""),
        "website": user.get("website", ""),
        "location": user.get("location", ""),
        "phone": user.get("phone", ""),
        "about": user.get("about", ""),
        "linkedin": user.get("linkedin", ""),
        "logo": user.get("logo", ""),
        "stats": {
            "total_opportunities": len(my_opportunities),
            "active_opportunities": active_opps,
            "total_applications": len(enriched_applications),
            "pending_review": pending_review,
            "shortlisted": shortlisted_count
        },
        "opportunities": my_opportunities,
        "applications": enriched_applications
    }


# =========================================================
# OPPORTUNITY CRUD
# =========================================================

@router.post("/opportunities")
def create_opportunity(
    payload: dict = Body(...),
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["recruiter"])(authorization or x_auth_token)
    if user.get("recruiter_status") not in ["approved", "verified"]:
        raise HTTPException(status_code=403, detail="Your recruiter account is pending approval by an administrator.")

    col = get_opportunities_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    title = payload.get("title", "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Opportunity title is required")

    skills = payload.get("required_skills", [])
    if isinstance(skills, str):
        skills = [s.strip() for s in skills.split(",") if s.strip()]

    company = user.get("company") or user.get("company_name") or payload.get("company", "Company")

    opp_data = {
        "title": title,
        "company": company,
        "description": payload.get("description", "").strip(),
        "required_skills": skills,
        "preferred_skills": payload.get("preferred_skills", []),
        "location": payload.get("location", "Remote").strip(),
        "type": payload.get("type", "Full-time"),
        "domain": payload.get("domain", "software"),
        "stipend": payload.get("stipend", ""),
        "salary": payload.get("salary", payload.get("stipend", "")),
        "experience": payload.get("experience", "0-2 Years"),
        "deadline": payload.get("deadline"),
        "apply_url": payload.get("apply_url", "").strip(),
        "source": "recruiter",
        "source_type": "recruiter",
        "is_active": True,
        "status": "Published",
        "created_by": str(user["_id"]),
        "created_at": datetime.utcnow()
    }

    result = col.insert_one(opp_data)
    opp_data["id"] = str(result.inserted_id)
    if "_id" in opp_data:
        del opp_data["_id"]

    return {
        "message": "Opportunity created successfully",
        "opportunity": serialize_recruiter_opp({"_id": result.inserted_id, **opp_data})
    }


@router.put("/opportunities/{opp_id}")
def update_opportunity(
    opp_id: str,
    payload: dict = Body(...),
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["recruiter"])(authorization or x_auth_token)
    if user.get("recruiter_status") not in ["approved", "verified"]:
        raise HTTPException(status_code=403, detail="Your recruiter account is pending approval.")

    col = get_opportunities_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    if not ObjectId.is_valid(opp_id):
        raise HTTPException(status_code=400, detail="Invalid opportunity ID")

    existing = col.find_one({"_id": ObjectId(opp_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    recruiter_id = str(user["_id"])
    if existing.get("created_by") != recruiter_id and existing.get("assigned_recruiter_id") != recruiter_id:
        raise HTTPException(status_code=403, detail="You do not own this opportunity")

    skills = payload.get("required_skills")
    if isinstance(skills, str):
        skills = [s.strip() for s in skills.split(",") if s.strip()]

    update_fields = {}
    for key in ["title", "company", "description", "location", "type", "domain", "stipend", "salary", "experience", "deadline", "apply_url", "status"]:
        if key in payload:
            update_fields[key] = payload[key]
    if skills is not None:
        update_fields["required_skills"] = skills

    update_fields["updated_at"] = datetime.utcnow()

    col.update_one({"_id": ObjectId(opp_id)}, {"$set": update_fields})
    updated = col.find_one({"_id": ObjectId(opp_id)})

    return {
        "message": "Opportunity updated successfully",
        "opportunity": serialize_recruiter_opp(updated)
    }


@router.patch("/opportunities/{opp_id}/status")
def toggle_opportunity_status(
    opp_id: str,
    payload: dict = Body(...),
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["recruiter"])(authorization or x_auth_token)
    col = get_opportunities_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    if not ObjectId.is_valid(opp_id):
        raise HTTPException(status_code=400, detail="Invalid opportunity ID")

    existing = col.find_one({"_id": ObjectId(opp_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    recruiter_id = str(user["_id"])
    if existing.get("created_by") != recruiter_id and existing.get("assigned_recruiter_id") != recruiter_id:
        raise HTTPException(status_code=403, detail="You do not own this opportunity")

    is_active = payload.get("is_active", not existing.get("is_active", True))
    new_status = "Published" if is_active else "Closed"
    col.update_one({"_id": ObjectId(opp_id)}, {"$set": {"is_active": is_active, "status": new_status, "updated_at": datetime.utcnow()}})

    return {
        "message": f"Opportunity is now {'active' if is_active else 'inactive'}",
        "is_active": is_active,
        "status": new_status
    }


@router.delete("/opportunities/{opp_id}")
def delete_opportunity(
    opp_id: str,
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["recruiter"])(authorization or x_auth_token)
    col = get_opportunities_collection()
    app_col = get_applications_collection()
    if col is None or app_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    if not ObjectId.is_valid(opp_id):
        raise HTTPException(status_code=400, detail="Invalid opportunity ID")

    existing = col.find_one({"_id": ObjectId(opp_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    recruiter_id = str(user["_id"])
    if existing.get("created_by") != recruiter_id and existing.get("assigned_recruiter_id") != recruiter_id:
        raise HTTPException(status_code=403, detail="You do not own this opportunity")

    # Safety check: prevent deleting if active applications exist
    apps_count = app_col.count_documents({"opportunity_id": opp_id})
    if apps_count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"This opportunity has {apps_count} applicant(s). Please close it instead to preserve candidate application records."
        )

    col.delete_one({"_id": ObjectId(opp_id)})
    return {"message": "Opportunity deleted successfully", "deleted_id": opp_id}


# =========================================================
# APPLICATION STATUS, NOTES & STUDENT NOTIFICATION
# =========================================================

@router.patch("/applications/{app_id}/status")
def update_application_status(
    app_id: str,
    payload: dict = Body(...),
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["recruiter"])(authorization or x_auth_token)

    if user.get("recruiter_status") not in ["approved", "verified"]:
        raise HTTPException(
            status_code=403,
            detail="Your recruiter account is pending approval."
        )

    app_col = get_applications_collection()
    opp_col = get_opportunities_collection()
    users_col = get_users_collection()

    if app_col is None or opp_col is None or users_col is None:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    if not ObjectId.is_valid(app_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid application ID"
        )

    app = app_col.find_one({"_id": ObjectId(app_id)})
    if not app:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    # Verify recruiter ownership or admin assignment
    opp_id = str(app["opportunity_id"])
    opp = opp_col.find_one({"_id": ObjectId(opp_id)}) if ObjectId.is_valid(opp_id) else None
    recruiter_id = str(user["_id"])

    if opp and (
        opp.get("created_by") != recruiter_id
        and opp.get("assigned_recruiter_id") != recruiter_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to modify this application"
        )

    new_status = payload.get("status")
    allowed_statuses = ["Applied", "Under Review", "Reviewing", "Shortlisted", "Interview", "Selected", "Rejected"]

    if new_status and new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of: {', '.join(allowed_statuses)}"
        )

    update_doc = {
        "updated_at": datetime.utcnow().isoformat()
    }
    if new_status:
        update_doc["status"] = new_status
    if "notes" in payload or "recruiter_notes" in payload:
        update_doc["recruiter_notes"] = payload.get("notes") or payload.get("recruiter_notes", "")

    app_col.update_one(
        {"_id": app["_id"]},
        {"$set": update_doc}
    )

    # Create real-time notification for Student
    student_id = app.get("student_id")
    if student_id and ObjectId.is_valid(student_id):
        opp_title = opp.get("title", "Opportunity") if opp else "Opportunity"
        opp_company = opp.get("company", user.get("company", "Company")) if opp else "Company"
        notification = {
            "id": f"app_{int(datetime.utcnow().timestamp())}",
            "title": f"Application Status: {new_status} 📋",
            "message": f"Your application for {opp_title} at {opp_company} has been updated to '{new_status}'.",
            "time": datetime.utcnow().isoformat(),
            "read": False
        }
        users_col.update_one(
            {"_id": ObjectId(student_id)},
            {"$push": {"notifications": {"$each": [notification], "$position": 0, "$slice": 20}}}
        )

    return {
        "message": "Application status updated successfully",
        "status": new_status or app.get("status"),
        "notes": update_doc.get("recruiter_notes", app.get("recruiter_notes", ""))
    }


# =========================================================
# DETAILED CANDIDATE PROFILE MODAL DATA
# =========================================================

@router.get("/applications/{app_id}/candidate")
def get_candidate_details(
    app_id: str,
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["recruiter"])(authorization or x_auth_token)
    app_col = get_applications_collection()
    opp_col = get_opportunities_collection()
    users_col = get_users_collection()

    if not ObjectId.is_valid(app_id):
        raise HTTPException(status_code=400, detail="Invalid application ID")

    app = app_col.find_one({"_id": ObjectId(app_id)})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    opp_id = str(app.get("opportunity_id", ""))
    opp = opp_col.find_one({"_id": ObjectId(opp_id)}) if ObjectId.is_valid(opp_id) else None

    # Check ownership
    recruiter_id = str(user["_id"])
    if opp and opp.get("created_by") != recruiter_id and opp.get("assigned_recruiter_id") != recruiter_id:
        raise HTTPException(status_code=403, detail="You do not have access to this candidate")

    student_id = app.get("student_id")
    student = users_col.find_one({"_id": ObjectId(student_id)}) if ObjectId.is_valid(student_id) else {}

    resume_info = student.get("resume") or {}
    github_info = student.get("github") or {}

    match_analysis = calculate_opportunity_match(resume_info, github_info, opp or {}, student)

    return {
        "application_id": str(app["_id"]),
        "status": app.get("status", "Applied"),
        "applied_at": app.get("applied_at"),
        "recruiter_notes": app.get("recruiter_notes", ""),
        "opportunity": {
            "id": opp_id,
            "title": opp.get("title", "") if opp else "",
            "company": opp.get("company", "") if opp else "",
            "required_skills": opp.get("required_skills", []) if opp else [],
            "location": opp.get("location", "") if opp else "",
            "type": opp.get("type", "") if opp else ""
        },
        "student": {
            "id": str(student.get("_id", student_id)),
            "name": student.get("name") or student.get("email", "").split("@")[0],
            "email": student.get("email", ""),
            "phone": student.get("phone", ""),
            "target_role": student.get("target_role", ""),
            "location": student.get("location", ""),
            "education": student.get("education") or student.get("college", ""),
            "profile_strength": student.get("profile_strength", 65),
            "created_at": str(student.get("created_at", ""))
        },
        "resume": {
            "skills": resume_info.get("skills", []),
            "ats_score": resume_info.get("ats_score", 0),
            "filename": resume_info.get("filename"),
            "uploaded_at": str(resume_info.get("uploaded_at", ""))
        },
        "github": {
            "username": github_info.get("username"),
            "stats": github_info.get("stats", {}),
            "repositories": [
                {
                    "name": r.get("name"),
                    "description": r.get("description"),
                    "language": r.get("language"),
                    "stars": r.get("stargazers_count", 0),
                    "forks": r.get("forks_count", 0),
                    "html_url": r.get("html_url")
                }
                for r in github_info.get("repositories", [])[:12]
            ]
        },
        "match_analysis": match_analysis
    }


# =========================================================
# AI MATCHED CANDIDATES DISCOVERY FOR OPPORTUNITY
# =========================================================

@router.get("/opportunities/{opp_id}/matched-candidates")
def get_opportunity_matched_candidates(
    opp_id: str,
    limit: int = 20,
    authorization: str = Header(None),
    x_auth_token: str = Header(None, alias="X-Auth-Token")
):
    user = require_roles(["recruiter"])(authorization or x_auth_token)
    opp_col = get_opportunities_collection()
    users_col = get_users_collection()

    if not ObjectId.is_valid(opp_id):
        raise HTTPException(status_code=400, detail="Invalid opportunity ID")

    opp = opp_col.find_one({"_id": ObjectId(opp_id)})
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    recruiter_id = str(user["_id"])
    if opp.get("created_by") != recruiter_id and opp.get("assigned_recruiter_id") != recruiter_id:
        raise HTTPException(status_code=403, detail="You do not own this opportunity")

    students = list(users_col.find({"role": "student"}).limit(100))
    matches = []

    for s in students:
        resume_info = s.get("resume") or {}
        github_info = s.get("github") or {}
        analysis = calculate_opportunity_match(resume_info, github_info, opp, s)
        matches.append({
            "student_id": str(s["_id"]),
            "name": s.get("name") or s.get("email", "").split("@")[0],
            "email": s.get("email", ""),
            "target_role": s.get("target_role", ""),
            "skills": resume_info.get("skills", []),
            "ats_score": resume_info.get("ats_score", 0),
            "github_username": github_info.get("username"),
            "match_analysis": analysis
        })

    # Sort descending by overall_match
    matches.sort(key=lambda x: x["match_analysis"]["overall_match"], reverse=True)
    return {
        "opportunity_title": opp.get("title"),
        "candidates": matches[:limit]
    }