from getpass import getpass
from datetime import datetime

from auth import pwd_context
from database import get_users_collection

    
def main():
    users = get_users_collection()

    if users is None:
        print("Database connection failed.")
        return

    email = input("Admin email: ").strip().lower()
    name = input("Admin name: ").strip()

    password = getpass("Set admin password: ")
    confirm = getpass("Confirm password: ")

    if password != confirm:
        print("Passwords do not match.")
        return

    if len(password.encode("utf-8")) > 72:
        print("Password must be 72 bytes or less.")
        return

    if len(password) < 12:
        print("Use a password with at least 12 characters.")
        return

    existing = users.find_one({"email": email})

    if existing:
        confirm_update = input(
            "This email already exists. Promote it to admin and reset its password? (yes/no): "
        ).strip().lower()

        if confirm_update != "yes":
            print("No changes made.")
            return

        users.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                "role": "admin",
                "password": pwd_context.hash(password),
                "provider": "email"
            }}
        )
        print("Existing account promoted to admin.")
        return

    users.insert_one({
        "name": name,
        "email": email,
        "password": pwd_context.hash(password),
        "provider": "email",
        "role": "admin",
        "created_at": datetime.utcnow()
    })

    print("Admin account created successfully.")


if __name__ == "__main__":
    main()