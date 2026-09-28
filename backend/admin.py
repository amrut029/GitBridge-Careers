from fastapi import APIRouter, HTTPException, Header, Body
from dashboard import require_roles
from database import get_users_collection, get_opportunities_collection, get_applications_collection, get_sync_logs_collection
from bson import ObjectId

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)

@router.get("/dashboard")
def get_admin_dashboard(authorization: str = Header(None)):
    user = require_roles(["admin"])(authorization)
    
    users_col = get_users_collection()
    opp_col = get_opportunities_collection()
    app_col = get_applications_collection()
    sync_col = get_sync_logs_collection()
    
    if not users_col or not opp_col or not app_col or not sync_col:
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
def get_recruiters(authorization: str = Header(None)):
    user = require_roles(["admin"])(authorization)
    users_col = get_users_collection()
    
    recruiters = list(users_col.find({"role": "recruiter"}))
    for r in recruiters:
        r["id"] = str(r["_id"])
        del r["_id"]
        if "password" in r:
            del r["password"]
            
    return {"recruiters": recruiters}

@router.patch("/recruiters/{recruiter_id}/status")
def update_recruiter_status(recruiter_id: str, payload: dict = Body(...), authorization: str = Header(None)):
    user = require_roles(["admin"])(authorization)
    users_col = get_users_collection()
    
    status = payload.get("status")
    if status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    try:
        users_col.update_one({"_id": ObjectId(recruiter_id), "role": "recruiter"}, {"$set": {"recruiter_status": status}})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID")
        
    return {"message": f"Recruiter status updated to {status}"}

@router.get("/sync-logs")
def get_sync_logs(authorization: str = Header(None)):
    user = require_roles(["admin"])(authorization)
    sync_col = get_sync_logs_collection()
    
    logs = list(sync_col.find().sort("started_at", -1).limit(50))
    for log in logs:
        log["id"] = str(log["_id"])
        del log["_id"]
        
    return {"sync_logs": logs}
