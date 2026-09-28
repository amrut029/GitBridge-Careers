import asyncio
from dashboard import OPPORTUNITIES_CATALOG
from database import connect_database, get_opportunities_collection, close_database
from datetime import datetime

def migrate_opportunities():
    print("Starting opportunity migration...")
    if not connect_database():
        print("Failed to connect to DB")
        return
    
    col = get_opportunities_collection()
    if col is None:
        print("Opportunities collection not found")
        return
        
    for opp in OPPORTUNITIES_CATALOG:
        existing = col.find_one({"source_id": opp["id"]})
        if not existing:
            opp_data = {
                **opp,
                "source": "gitbridge_curated",
                "source_type": "admin",
                "source_id": opp["id"],
                "created_at": datetime.utcnow(),
                "is_active": True
            }
            # Remove the old dict ID to let Mongo use _id
            if "id" in opp_data:
                del opp_data["id"]
                
            col.insert_one(opp_data)
            print(f"Inserted opportunity: {opp['title']}")
        else:
            print(f"Opportunity {opp['title']} already exists, skipping.")
            
    print("Migration complete.")
    close_database()

if __name__ == "__main__":
    migrate_opportunities()
