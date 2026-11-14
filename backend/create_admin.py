
import os
from getpass import getpass

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from werkzeug.security import generate_password_hash

load_dotenv()

mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    raise SystemExit("MONGO_URI is missing from your backend .env file.")

email = input("Enter admin email: ").strip().lower()
name = input("Enter admin name: ").strip()
password = getpass("Create admin password (minimum 8 characters): ")

if not name or "@" not in email:
    raise SystemExit("Please enter a valid name and email.")

if len(password) < 8:
    raise SystemExit("Password must contain at least 8 characters.")

try:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
    client.admin.command("ping")

    # Uses the same database selected by your MONGO_URI
    db = client.get_default_database()
    users = db["users"]

    existing_user = users.find_one({"email": email})

    if existing_user:
        if existing_user.get("role") == "admin":
            raise SystemExit("An admin with this email already exists.")

        raise SystemExit(
            "This email already belongs to a customer. "
            "Choose a different email; no account was changed."
        )

    users.insert_one({
        "name": name,
        "email": email,
        "password": generate_password_hash(password),
        "role": "admin",
    })

    print(f"Admin account created successfully for {email}.")

except PyMongoError as error:
    print("MongoDB error:", error)

finally:
    if "client" in locals():
        client.close()
