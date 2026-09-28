from database import get_opportunities_collection, get_sync_logs_collection
from datetime import datetime

def sync_from_source(source_name: str, opportunities_data: list):
    """
    Modular sync function to pull opportunities from an external source adapter.
    Normalizes, deduplicates, and saves them to MongoDB.
    """
    col = get_opportunities_collection()
    sync_logs = get_sync_logs_collection()
    
    if col is None or sync_logs is None:
        return {"status": "error", "message": "Database not connected"}
        
    sync_start = datetime.utcnow()
    records_added = 0
    records_updated = 0
    errors = []
    
    for item in opportunities_data:
        try:
            # Deduplication key
            source_id = str(item.get("source_id", item.get("id")))
            
            existing = col.find_one({"source": source_name, "source_id": source_id})
            
            opp_data = {
                "title": item.get("title"),
                "company": item.get("company"),
                "description": item.get("description", ""),
                "required_skills": item.get("required_skills", []),
                "location": item.get("location"),
                "type": item.get("type"),
                "domain": item.get("domain", "software"),
                "source": source_name,
                "source_type": "external",
                "source_id": source_id,
                "apply_url": item.get("apply_url"),
                "is_active": True,
                "updated_at": datetime.utcnow()
            }
            
            if existing:
                col.update_one({"_id": existing["_id"]}, {"$set": opp_data})
                records_updated += 1
            else:
                opp_data["created_at"] = datetime.utcnow()
                col.insert_one(opp_data)
                records_added += 1
        except Exception as e:
            errors.append(str(e))
            
    sync_end = datetime.utcnow()
    
    log_entry = {
        "source": source_name,
        "source_type": "external",
        "started_at": sync_start.isoformat(),
        "completed_at": sync_end.isoformat(),
        "status": "completed" if not errors else "completed_with_errors",
        "records_found": len(opportunities_data),
        "records_added": records_added,
        "records_updated": records_updated,
        "errors": errors
    }
    
    sync_logs.insert_one(log_entry)
    
    return log_entry
