import os
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi

load_dotenv()


# =========================================================
# ENVIRONMENT VARIABLES
# =========================================================

MONGO_URL = os.getenv("MONGO_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "gitbridge")


# =========================================================
# GLOBAL VARIABLES
# =========================================================

client = None
database = None
users_collection = None


# =========================================================
# CONNECT DATABASE
# =========================================================

def connect_database():

    global client
    global database
    global users_collection

    # Already connected
    if database is not None:
        return True

    if not MONGO_URL:
        print("❌ MONGO_URL not found in .env")
        return False

    try:

        print("🔄 Connecting to MongoDB...")

        client = MongoClient(
            MONGO_URL,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=10000
        )

        # Test connection
        client.admin.command("ping")

        database = client[DATABASE_NAME]

        users_collection = database["users"]

        print("✅ MongoDB Connected Successfully!")

        return True

    except Exception as error:

        print("❌ MongoDB Connection Error:")
        print(error)

        client = None
        database = None
        users_collection = None

        return False


# =========================================================
# GET DATABASE
# =========================================================

def get_database():

    global database

    if database is None:
        connect_database()

    return database


# =========================================================
# GET USERS COLLECTION
# =========================================================

def get_users_collection():

    global users_collection

    if users_collection is None:
        success = connect_database()

        if not success:
            return None

    return users_collection


def get_support_tickets_collection():
    db = get_database()
    if db is None:
        return None
    return db["support_tickets"]


def get_opportunities_collection():
    db = get_database()
    return db["opportunities"] if db is not None else None

def get_applications_collection():
    db = get_database()
    return db["applications"] if db is not None else None

def get_bookmarks_collection():
    db = get_database()
    return db["bookmarks"] if db is not None else None

def get_sync_logs_collection():
    db = get_database()
    return db["sync_logs"] if db is not None else None


# =========================================================
# CLOSE DATABASE
# =========================================================

def close_database():

    global client
    global database
    global users_collection

    if client is not None:

        client.close()

        print("🔴 MongoDB Connection Closed")

    client = None
    database = None
    users_collection = None