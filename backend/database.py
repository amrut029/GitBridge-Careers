import os

from dotenv import load_dotenv
from pymongo import MongoClient


load_dotenv()


# =========================================================
# ENVIRONMENT VARIABLES
# =========================================================

MONGODB_URL = os.getenv("MONGODB_URL")
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

    if not MONGODB_URL:
        print("❌ MONGODB_URL not found in .env")
        return False

    # Check if placeholder values are still present
    if (
        "YOUR_USERNAME" in MONGODB_URL
        or "YOUR_PASSWORD" in MONGODB_URL
        or "YOUR_NEW_PASSWORD" in MONGODB_URL
        or "xxxxx.mongodb.net" in MONGODB_URL
    ):
        print("❌ Please add your real MongoDB Atlas URL in .env")
        return False

    try:

        client = MongoClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=10000
        )

        # Test MongoDB connection
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
        connect_database()

    return users_collection


# =========================================================
# CLOSE DATABASE
# =========================================================

def close_database():

    global client
    global database
    global users_collection

    if client is not None:

        client.close()

        print("🛑 MongoDB Connection Closed")

    client = None
    database = None
    users_collection = None