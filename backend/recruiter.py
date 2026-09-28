from fastapi import APIRouter, HTTPException, Header, Body
from dashboard import require_roles, get_current_user
from database import get_opportunities_collection, get_applications_collection, get_users_collection
from datetime import datetime
from bson import ObjectId

router = APIRouter(
    prefix="/api/recruiter",
    tags=["Recruiter"]
)

@router.get("/dashboard")
def get_recruiter_dashboard(authorization: str = Header(None)):
    user = require_roles(["recruiter"])(authorization)
    
    opp_col = get_opportunities_collection()
    app_col = get_applications_collection()
    
    if not opp_col or not app_col:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    my_opportunities = list(opp_col.find({"created_by": str(user["_id"])}))
    for opp in my_opportunities:
        opp["id"] = str(opp["_id"])
        del opp["_id"]
        
    my_opp_ids = [opp["id"] for opp in my_opportunities]
    applications = list(app_col.find({"opportunity_id": {"$in": my_opp_ids}}))
    for app in applications:
        app["id"] = str(app["_id"])
        del app["_id"]
        
    return {
        "status": user.get("recruiter_status", "pending"),
        "opportunities": my_opportunities,
        "total_applications": len(applications),
        "applications": applications
    }

@router.post("/opportunities")
def create_opportunity(payload: dict = Body(...), authorization: str = Header(None)):
    user = require_roles(["recruiter"])(authorization)
    if user.get("recruiter_status") != "approved":
        raise HTTPException(status_code=403, detail="Your recruiter account is pending approval.")
        
    col = get_opportunities_collection()
    if not col:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    opp_data = {
        "title": payload.get("title"),
        "company": user.get("company", "Unknown"),
        "description": payload.get("description", ""),
        "required_skills": payload.get("required_skills", []),
        "location": payload.get("location"),
        "type": payload.get("type"),
        "domain": payload.get("domain", "software"),
        "source": "recruiter",
        "source_type": "recruiter",
        "is_active": True,
        "created_by": str(user["_id"]),
        "created_at": datetime.utcnow()
    }
    
    result = col.insert_one(opp_data)
    return {"message": "Opportunity created successfully", "id": str(result.inserted_id)}

@router.patch("/applications/{app_id}/status")
def update_application_status(app_id: str, payload: dict = Body(...), authorization: str = Header(None)):
    user = require_roles(["recruiter"])(authorization)
    
    if user.get("recruiter_status") != "approved":
        raise HTTPException(status_code=403, detail="Your recruiter account is pending approval.")
        
    app_col = get_applications_collection()
    opp_col = get_opportunities_collection()
    
    if not app_col or not opp_col:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        app = app_col.find_one({"_id": ObjectId(app_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid application ID")
        
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Verify ownership
    opp_id = app["opportunity_id"]
    try:
        opp_query = {"_id": ObjectId(opp_id)} if len(opp_id) == 24 else {"source_id": opp_id}
        opp = opp_col.find_one(opp_query)
    except Exception:
        opp = None
        
    if not opp or opp.get("created_by") != str(user["_id"]):
        raise HTTPException(status_code=403, detail="You do not have permission to modify this application")
        
    new_status = payload.get("status")
    if new_status not in ["Applied", "Reviewing", "Shortlisted", "Selected", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    app_col.update_one({"_id": app["_id"]}, {"$set": {"status": new_status, "updated_at": datetime.utcnow().isoformat()}})
    
    return {"message": "Application status updated successfully", "status": new_status}
