import smtplib
from email.message import EmailMessage
import hashlib
import secrets
import os
import math
import base64

from datetime import datetime, timezone
from datetime import timedelta
from bson import ObjectId
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from PIL import Image, UnidentifiedImageError
from io import BytesIO
from flask_cors import CORS
from functools import wraps
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from werkzeug.security import generate_password_hash, check_password_hash

clip_processor = None
clip_model = None
CLIP_DEVICE = "cpu"

def load_clip_model():
    global clip_processor, clip_model, CLIP_DEVICE

    if clip_model is None:
        import torch
        from transformers import CLIPModel, CLIPProcessor

        model_name = "openai/clip-vit-base-patch32"

        clip_processor = CLIPProcessor.from_pretrained(model_name)
        clip_model = CLIPModel.from_pretrained(model_name)
        clip_model.eval()

        CLIP_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
        clip_model = clip_model.to(CLIP_DEVICE)

    return torch, clip_processor, clip_model

# --------------------------------------------------
# 1. ENVIRONMENT CONFIGURATION
# --------------------------------------------------

load_dotenv()
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

if not app.config["JWT_SECRET_KEY"]:
    raise RuntimeError(
        "JWT_SECRET_KEY is missing from backend/.env"
    )

from datetime import timedelta

app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)

jwt = JWTManager(app)


# --------------------------------------------------
# 2. MONGODB CONNECTION
# --------------------------------------------------

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI is missing from backend/.env")

client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=10000,
)

db = client["greencart"]
products_collection = db["products"]
orders_collection = db["orders"]
users_collection = db["users"]
ratings_collection = db["ratings"]
categories_collection = db["categories"]
notifications_collection = db["notifications"]

# Prevent duplicate reminder notifications
notifications_collection.create_index(
    [("userId", 1), ("reminderKey", 1)],
    unique=True,
    partialFilterExpression={
        "reminderKey": {"$type": "string"}
    }
)

def admin_required():
    def decorator(view_function):
        @wraps(view_function)
        @jwt_required()
        def wrapped(*args, **kwargs):
            user_id = get_jwt_identity()

            if not ObjectId.is_valid(user_id):
                return error_response("Admin access required", 403)

            try:
                user = users_collection.find_one({
                    "_id": ObjectId(user_id)
                })
            except PyMongoError as error:
                print("Admin authorization error:", error)
                return error_response(
                    "Unable to verify permissions", 500
                )

            if not user or user.get("role") != "admin":
                return error_response("Admin access required", 403)

            return view_function(*args, **kwargs)

        return wrapped
    return decorator

  
# --------------------------------------------------
# 3. HELPER FUNCTIONS
# --------------------------------------------------

def serialize_document(document):
    """Convert MongoDB ObjectId values into JSON-compatible values."""
    if document is None:
        return None

    result = {}

    for key, value in document.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        else:
            result[key] = value

    return result


def error_response(message, status_code=400):
    return jsonify({
        "success": False,
        "message": message,
    }), status_code


def find_document_by_id(collection, document_id):
    """Find a document using either MongoDB _id or a custom id."""
    if ObjectId.is_valid(document_id):
        document = collection.find_one({
            "_id": ObjectId(document_id)
        })

        if document:
            return document

    return collection.find_one({"id": document_id})


def get_json_body():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else None


def current_utc_time():
    return datetime.now(timezone.utc).isoformat()

def create_email_verification_token():
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()

    return token, token_hash

# Send emails using Gmail SMTP
def send_email(to_email, subject, body):
    if not all([
        MAIL_USERNAME,
        MAIL_PASSWORD,
        MAIL_DEFAULT_SENDER,
    ]):
        raise RuntimeError("Email settings are missing from .env")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = MAIL_DEFAULT_SENDER
    message["To"] = to_email
    message.set_content(body)

    with smtplib.SMTP(MAIL_SERVER, MAIL_PORT, timeout=20) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.send_message(message)


# Your existing API routes continue below

# --------------------------------------------------
# 4. BASIC AND DATABASE STATUS ROUTES
# --------------------------------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "Welcome to the GreenCart API",
        "status": "running",
    })


@app.route("/api/db-status", methods=["GET"])
def database_status():
    try:
        client.admin.command("ping")

        return jsonify({
            "success": True,
            "message": "MongoDB connection successful",
        }), 200

    except PyMongoError as error:
        print("MongoDB connection error:", error)

        return error_response(
            "Unable to connect to MongoDB",
            503,
        )


# --------------------------------------------------
# 5. PRODUCT APIs
# --------------------------------------------------

@app.route("/api/products", methods=["GET"])
def get_products():
    try:
        products = [
            serialize_document(product)
            for product in products_collection.find()
        ]

        # Calculate average rating for each product
        for product in products:
            product_id = product["_id"]

            ratings = list(
                ratings_collection.find(
                    {"product_id": str(product_id)}
                )
            )

            if ratings:
                average_rating = sum(
                    float(item.get("rating", 0))
                    for item in ratings
                ) / len(ratings)

                product["rating"] = round(average_rating, 1)
                product["ratingCount"] = len(ratings)
            else:
                product["rating"] = 0
                product["ratingCount"] = 0

        return jsonify({
            "success": True,
            "count": len(products),
            "products": products,
        }), 200

    except PyMongoError as error:
        print("Error fetching products:", error)
        return error_response("Unable to fetch products", 500)


@app.route("/api/products/<product_id>", methods=["GET"])
def get_product(product_id):
    try:
        product = find_document_by_id(
            products_collection,
            product_id,
        )

        if not product:
            return error_response("Product not found", 404)

        product = serialize_document(product)

        return jsonify({
            "success": True,
            "product": product,
        }), 200

    except PyMongoError as error:
        print("Error fetching product:", error)
        return error_response("Unable to fetch product", 500)



@app.route("/api/products", methods=["POST"])
@admin_required()
def create_product():
    data = get_json_body()

    if data is None:
        return error_response("A valid JSON body is required")

    name = data.get("name")
    category = data.get("category")

    if not isinstance(name, str) or not name.strip():
        return error_response("Product name is required")

    if not isinstance(category, str) or not category.strip():
        return error_response("Product category is required")

    # Validate price, stock
    # Validate price and stock
    try:
        price = float(data.get("price"))
        stock_value = float(data.get("stock"))

        if (
            not math.isfinite(price)
            or price < 0
            or not math.isfinite(stock_value)
            or not stock_value.is_integer()
            or stock_value < 0
        ):
            raise ValueError

        stock = int(stock_value)

    except (TypeError, ValueError, OverflowError):
        return error_response(
            "Enter a valid price and whole-number stock"
        )

    status = data.get("status", "Active")

    if status not in ("Active", "Inactive"):
        return error_response("Invalid product status")

    image = data.get("image", "")
    images = data.get("images", [image] if image else [])
    description = data.get("description", "")

    if not isinstance(image, str):
        return error_response("Image must be a string")

    if (
        not isinstance(images, list)
        or not all(isinstance(item, str) for item in images)
    ):
        return error_response("Images must be a list of strings")

    if not isinstance(description, str):
        return error_response("Description must be a string")

    # Use the first gallery image as the main image.
    if images:
        image = images[0]

        # Validate expiry date
    expiry_date = data.get("expiryDate") or None

    if expiry_date:
        if not isinstance(expiry_date, str):
            return error_response("Invalid expiry date")

        try:
            datetime.strptime(expiry_date, "%Y-%m-%d")
        except ValueError:
            return error_response("Expiry date must be in YYYY-MM-DD format")

    # Validate estimated usage days
    usage_days = data.get("estimatedUsageDays")

    if usage_days not in (None, ""):
        try:
            usage_days = int(usage_days)

            if usage_days <= 0:
                raise ValueError
        except (TypeError, ValueError, OverflowError):
            return error_response("Estimated usage days must be a positive whole number")
    else:
        usage_days = None
    # Create the product regardless of whether images exist.
    product = {
        "name": name.strip(),
        "category": category.strip(),
        "price": price,
        "stock": stock,
        "description": description.strip(),
        "status": status,
        "image": image,
        "images": images,
         "expiryDate": expiry_date,
        "estimatedUsageDays": usage_days,
        "createdAt": current_utc_time(),
    }

    try:
        result = products_collection.insert_one(product)
        product["_id"] = result.inserted_id

        return jsonify({
            "success": True,
            "message": "Product added successfully",
            "product": serialize_document(product),
        }), 201

    except PyMongoError as error:
        print("Error creating product:", error)
        return error_response("Unable to save product", 500)


@app.route("/api/products/<product_id>", methods=["PUT"])
@admin_required()
def update_product(product_id):
    data = get_json_body()

    if data is None:
        return error_response("A valid JSON body is required")

    name = data.get("name")
    category = data.get("category")

    if not isinstance(name, str) or not name.strip():
        return error_response("Product name is required")

    if not isinstance(category, str) or not category.strip():
        return error_response("Product category is required")

    # Validate price, stock, and rating
    try:
        price = float(data.get("price"))
        stock_value = float(data.get("stock"))
        rating = float(data.get("rating", 0))

        if (
            not math.isfinite(price)
            or price < 0
            or not math.isfinite(stock_value)
            or not stock_value.is_integer()
            or stock_value < 0
            or not math.isfinite(rating)
            or rating < 0
            or rating > 5
        ):
            raise ValueError

        stock = int(stock_value)

    except (TypeError, ValueError, OverflowError):
        return error_response(
            "Enter a valid price, whole-number stock, "
            "and rating between 0 and 5"
        )

    status = data.get("status", "Active")

    if status not in ("Active", "Inactive"):
        return error_response("Invalid product status")

    image = data.get("image", "")
    images = data.get("images", [image] if image else [])
    description = data.get("description", "")

    if not isinstance(image, str):
        return error_response("Image must be a string")

    if (
        not isinstance(images, list)
        or not all(isinstance(item, str) for item in images)
    ):
        return error_response("Images must be a list of strings")

    if not isinstance(description, str):
        return error_response("Description must be a string")

        # Validate expiry date
    expiry_date = data.get("expiryDate") or None

    if expiry_date:
        if not isinstance(expiry_date, str):
            return error_response("Invalid expiry date")

        try:
            datetime.strptime(expiry_date, "%Y-%m-%d")
        except ValueError:
            return error_response(
                "Expiry date must be in YYYY-MM-DD format"
            )

    # Validate estimated usage days
    usage_days = data.get("estimatedUsageDays")

    if usage_days not in (None, ""):
        try:
            usage_days = int(usage_days)

            if usage_days <= 0:
                raise ValueError
        except (TypeError, ValueError, OverflowError):
            return error_response(
                "Estimated usage days must be a positive whole number"
            )
    else:
        usage_days = None
    # Synchronize the main image with the gallery.
    if images:
        image = images[0]

    query = (
        {"_id": ObjectId(product_id)}
        if ObjectId.is_valid(product_id)
        else {"id": product_id}
    )

    updated_fields = {
        "name": name.strip(),
        "category": category.strip(),
        "price": price,
        "stock": stock,
        "description": description.strip(),
        "status": status,
        "image": image,
        "images": images,
        "expiryDate": expiry_date,
        "estimatedUsageDays": usage_days,
        "updatedAt": current_utc_time(),
    }

    try:
        result = products_collection.update_one(
            query,
            {"$set": updated_fields},
        )

        if result.matched_count == 0:
            return error_response("Product not found", 404)

        product = serialize_document(
            products_collection.find_one(query)
        )

        return jsonify({
            "success": True,
            "message": "Product updated successfully",
            "product": product,
        }), 200

    except PyMongoError as error:
        print("Error updating product:", error)
        return error_response("Unable to update product", 500)


@app.route("/api/products/<product_id>", methods=["DELETE"])
@admin_required()
def delete_product(product_id):
    try:
        query = (
            {"_id": ObjectId(product_id)}
            if ObjectId.is_valid(product_id)
            else {"id": product_id}
        )

        result = products_collection.delete_one(query)

        if result.deleted_count == 0:
            return error_response("Product not found", 404)

        return jsonify({
            "success": True,
            "message": "Product deleted successfully",
        }), 200

    except PyMongoError as error:
        print("Error deleting product:", error)
        return error_response("Unable to delete product", 500)


# --------------------------------------------------
# PRODUCT RATING APIs
# --------------------------------------------------

@app.route("/api/products/<product_id>/ratings", methods=["GET"])
def get_product_ratings(product_id):
    try:
        product = find_document_by_id(
            products_collection,
            product_id,
        )

        if not product:
            return error_response("Product not found", 404)

        ratings = list(
            ratings_collection.find(
                {"product_id": str(product_id)},
                {"_id": 0},
            ).sort("created_at", -1)
        )

        for item in ratings:
            customer = None

            if item.get("user_id"):
                customer = find_document_by_id(
                    users_collection,
                    str(item["user_id"]),
                )

            item["customerName"] = (
                customer.get("name", "Customer")
                if customer else "Customer"
            )

            item["review"] = item.get("review", "")
            item["createdAt"] = str(item.get("created_at", ""))

            item.pop("user_id", None)
            item.pop("created_at", None)

        average = (
            sum(float(item["rating"]) for item in ratings) / len(ratings)
            if ratings else 0
        )

        return jsonify({
            "success": True,
            "averageRating": round(average, 1),
            "ratingCount": len(ratings),
            "ratings": ratings,
        }), 200

    except (PyMongoError, TypeError, ValueError, KeyError) as error:
        print("Error retrieving ratings:", error)
        return error_response("Unable to retrieve ratings", 500)

@app.route("/api/products/<product_id>/ratings", methods=["POST"])
@jwt_required()
def submit_product_rating(product_id):
    data = get_json_body()

    if data is None:
        return error_response("A valid JSON body is required")

    try:
        rating = float(data.get("rating"))
    except (TypeError, ValueError, OverflowError):
        return error_response("Rating must be between 1 and 5")

    if not math.isfinite(rating) or not 1 <= rating <= 5:
        return error_response("Rating must be between 1 and 5")

    # Get the logged-in customer's ID from the JWT.
    user_id = get_jwt_identity()

    try:
        # Confirm the product exists.
        product = find_document_by_id(
            products_collection,
            product_id,
        )

        if not product:
            return error_response("Product not found", 404)

        # Confirm the customer exists and is allowed to rate.
        customer = find_document_by_id(
            users_collection,
            user_id,
        )

        if not customer or customer.get("role", "customer") != "customer":
            return error_response(
                "A customer account is required to submit a rating",
                403,
            )

        if customer.get("status", "Active") == "Inactive":
            return error_response(
                "Your account is inactive and cannot submit ratings",
                403,
            )

        review = str(data.get("review", "")).strip()

        if not review:
            return error_response("Please write a review")

        if len(review) > 500:
            return error_response(
                "Review cannot exceed 500 characters"
            )
            
        # Save the rating with the customer's identity.
        rating_document = {
            "product_id": str(product_id),
            "user_id": str(customer["_id"]),
            "rating": rating,
            "review": review,
            "created_at": current_utc_time(),
        }

        result = ratings_collection.insert_one(rating_document)

        return jsonify({
            "success": True,
            "message": "Thank you for rating this product!",
            "ratingId": str(result.inserted_id),
        }), 201

    except PyMongoError as error:
        print("Error saving rating:", error)
        return error_response("Unable to save rating", 500)


# --------------------------------------------------
# ADMIN RATINGS AND FEEDBACK API
# --------------------------------------------------

@app.route("/api/admin/ratings", methods=["GET"])
@admin_required()
def get_admin_ratings():
    try:
        rating_documents = list(
            ratings_collection.find().sort("_id", -1)
        )

        all_ratings = []

        for rating in rating_documents:
            product_id = str(rating.get("product_id", ""))
            customer_id = rating.get("user_id")

            # Find the rated product.
            product = find_document_by_id(
                products_collection,
                product_id,
            )

            # Find the customer only when a customer ID was saved.
            customer = None

            if customer_id:
                customer = find_document_by_id(
                    users_collection,
                    str(customer_id),
                )

            all_ratings.append({
                "id": str(rating.get("_id", "")),
                "productId": product_id,
                "productName": (
                    product.get("name", "Deleted product")
                    if product else "Deleted product"
                ),
                "productImage": (
                    product.get("image", "")
                    if product else ""
                ),
                "customerName": (
                    customer.get("name", "Unknown customer")
                    if customer else "Not recorded"
                ),
                "customerEmail": (
                    customer.get("email", "")
                    if customer else ""
                ),
                "rating": rating.get("rating", 0),
                "review": rating.get("review", ""),
                "createdAt": rating.get("created_at", ""),
            })

        rating_count = len(all_ratings)

        average_rating = (
            sum(float(item["rating"]) for item in all_ratings)
            / rating_count
            if rating_count else 0
        )

        return jsonify({
            "success": True,
            "count": rating_count,
            "averageRating": round(average_rating, 1),
            "ratings": all_ratings,
        }), 200

    except (PyMongoError, TypeError, ValueError) as error:
        print("Error fetching admin ratings:", error)
        return error_response(
            "Unable to fetch ratings and feedback",
            500,
        )


@app.route("/api/products/visual-search", methods=["POST"])
def visual_product_search():
        try:
        torch, clip_processor, clip_model = load_clip_model()
    except ImportError:
        return error_response(
            "Visual search is temporarily unavailable.",
            503,
        )
    if "image" not in request.files:
        return error_response("Please upload an image.")

    image_file = request.files["image"]

    if not image_file.filename:
        return error_response("No image selected.")

    if image_file.mimetype not in {
        "image/jpeg", "image/png", "image/webp"
    }:
        return error_response("Upload a JPG, PNG, or WebP image.")

    image_bytes = image_file.read()

    if not image_bytes or len(image_bytes) > 5 * 1024 * 1024:
        return error_response(
            "The image must be non-empty and no larger than 5 MB."
        )

    try:
        with Image.open(BytesIO(image_bytes)) as image:
            uploaded_image = image.convert("RGB")

        inputs = clip_processor(
            images=uploaded_image,
            return_tensors="pt"
        )
        inputs = {
            key: value.to(CLIP_DEVICE)
            for key, value in inputs.items()
        }

        with torch.inference_mode():
            uploaded_features = clip_model.get_image_features(**inputs)

            if hasattr(uploaded_features, "pooler_output"):
                uploaded_features = uploaded_features.pooler_output

            uploaded_features = torch.nn.functional.normalize(
                uploaded_features, p=2, dim=-1
            )
            

        matches = []

        for product in products_collection.find({
            "status": {"$regex": "^active$", "$options": "i"}
        }):
            image_data = product.get("image", "")

            if not isinstance(image_data, str) or not image_data:
                continue

            try:
                encoded_image = (
                    image_data.split(",", 1)[1]
                    if image_data.startswith("data:")
                    else image_data
                )

                product_image_bytes = base64.b64decode(
                    encoded_image, validate=True
                )

                with Image.open(BytesIO(product_image_bytes)) as image:
                    product_image = image.convert("RGB")

                product_inputs = clip_processor(
                    images=product_image,
                    return_tensors="pt"
                )
                product_inputs = {
                    key: value.to(CLIP_DEVICE)
                    for key, value in product_inputs.items()
                }

                with torch.inference_mode():
                    product_features = clip_model.get_image_features(**product_inputs)

                    if hasattr(product_features, "pooler_output"):
                        product_features = product_features.pooler_output

                    product_features = torch.nn.functional.normalize(
                        product_features, p=2, dim=-1
                    )

                    similarity = torch.sum(
                        uploaded_features * product_features, dim=-1
                    ).item()

                product_data = serialize_document(product)
                product_data["similarity"] = round(
                    similarity * 100, 2
                )
                matches.append(product_data)

            except (
                ValueError, TypeError, OSError,
                UnidentifiedImageError
            ):
                continue

        matches.sort(
            key=lambda item: item["similarity"],
            reverse=True
        )

        matches = matches[:8]

        return jsonify({
            "success": True,
            "message": (
                "Similar products found."
                if matches
                else "No active products with usable images were found."
            ),
            "count": len(matches),
            "matches": matches
        }), 200

    except (UnidentifiedImageError, OSError, ValueError) as error:
        print("Uploaded image processing error:", error)
        return error_response("Unable to process the uploaded image.")

    except Exception as error:
        print("Visual search error:", error)
        return error_response("Image search failed. Please try again.", 500)



# --------------------------------------------------
# 6. CATEGORIES  APIs
# --------------------------------------------------

@app.route("/api/categories", methods=["GET"])
def get_categories():
    try:
        categories = [
            serialize_document(category)
            for category in categories_collection.find().sort("name", 1)
        ]

        return jsonify({
            "success": True,
            "count": len(categories),
            "categories": categories,
        }), 200

    except PyMongoError as error:
        print("Error fetching categories:", error)
        return error_response("Unable to fetch categories", 500)


@app.route("/api/categories", methods=["POST"])
@admin_required()
def create_category():
    data = get_json_body()

    if data is None:
        return error_response("A valid JSON body is required")

    name = data.get("name")
    description = data.get("description", "")

    if not isinstance(name, str) or not name.strip():
        return error_response("Category name is required")

    if not isinstance(description, str):
        return error_response("Description must be a string")

    name = name.strip()

    try:
        existing = categories_collection.find_one({
            "name": {"$regex": f"^{__import__('re').escape(name)}$", "$options": "i"}
        })

        if existing:
            return error_response("Category already exists", 409)

        category = {
            "name": name,
            "description": description.strip(),
            "createdAt": current_utc_time(),
        }

        result = categories_collection.insert_one(category)
        category["_id"] = result.inserted_id

        return jsonify({
            "success": True,
            "message": "Category added successfully",
            "category": serialize_document(category),
        }), 201

    except PyMongoError as error:
        print("Error creating category:", error)
        return error_response("Unable to save category", 500)


@app.route("/api/categories/<category_id>", methods=["PUT"])
@admin_required()
def update_category(category_id):
    data = get_json_body()

    if data is None:
        return error_response("A valid JSON body is required")

    name = data.get("name")
    description = data.get("description", "")

    if not isinstance(name, str) or not name.strip():
        return error_response("Category name is required")

    if not isinstance(description, str):
        return error_response("Description must be a string")

    name = name.strip()

    query = (
        {"_id": ObjectId(category_id)}
        if ObjectId.is_valid(category_id)
        else {"id": category_id}
    )

    try:
        current = categories_collection.find_one(query)

        if not current:
            return error_response("Category not found", 404)

        duplicate = categories_collection.find_one({
            "_id": {"$ne": current["_id"]},
            "name": {"$regex": f"^{__import__('re').escape(name)}$", "$options": "i"}
        })

        if duplicate:
            return error_response("Category already exists", 409)

        old_name = current["name"]

        categories_collection.update_one(
            query,
            {"$set": {
                "name": name,
                "description": description.strip(),
                "updatedAt": current_utc_time(),
            }},
        )

        # Keep products linked to the renamed category.
        if old_name != name:
            products_collection.update_many(
                {"category": old_name},
                {"$set": {"category": name}},
            )

        updated = serialize_document(categories_collection.find_one(query))

        return jsonify({
            "success": True,
            "message": "Category updated successfully",
            "category": updated,
        }), 200

    except PyMongoError as error:
        print("Error updating category:", error)
        return error_response("Unable to update category", 500)


@app.route("/api/categories/<category_id>", methods=["DELETE"])
@admin_required()
def delete_category(category_id):
    query = (
        {"_id": ObjectId(category_id)}
        if ObjectId.is_valid(category_id)
        else {"id": category_id}
    )

    try:
        category = categories_collection.find_one(query)

        if not category:
            return error_response("Category not found", 404)

        products_using_category = products_collection.count_documents({
            "category": category["name"]
        })

        if products_using_category > 0:
            return error_response(
                "Cannot delete this category because products use it",
                400,
            )

        categories_collection.delete_one(query)

        return jsonify({
            "success": True,
            "message": "Category deleted successfully",
        }), 200

    except PyMongoError as error:
        print("Error deleting category:", error)
        return error_response("Unable to delete category", 500)


# --------------------------------------------------
# ADMIN USERS API
# --------------------------------------------------


@app.route("/api/admin/users", methods=["GET"])
@admin_required()
def get_admin_users():
    try:
        users = users_collection.find(
            {"role": "customer"},
            {"password": 0},
        ).sort("_id", -1)

        user_list = []

        for user in users:
            user_list.append({
                "id": str(user["_id"]),
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "role": user.get("role", "customer"),
                "createdAt": user.get("createdAt", ""),
                "status": user.get("status", "Active"),
            })

        return jsonify({
            "success": True,
            "count": len(user_list),
            "users": user_list,
        }), 200

    except PyMongoError as error:
        print("Error fetching admin users:", error)
        return error_response(
            "Unable to fetch users",
            500,
        )


@app.route("/api/admin/users/<user_id>/status", methods=["PATCH"])
@admin_required()
def update_customer_status(user_id):
    try:
        from bson import ObjectId
        from bson.errors import InvalidId

        data = request.get_json(silent=True) or {}
        status = data.get("status")

        if status not in ["Active", "Inactive"]:
            return jsonify({
                "success": False,
                "message": "Status must be Active or Inactive"
            }), 400

        try:
            customer_id = ObjectId(user_id)
        except (InvalidId, TypeError):
            return jsonify({
                "success": False,
                "message": "Invalid customer ID"
            }), 400

        result = users_collection.update_one(
            {"_id": customer_id, "role": "customer"},
            {"$set": {"status": status}}
        )

        if result.matched_count == 0:
            return jsonify({
                "success": False,
                "message": "Customer not found"
            }), 404

        return jsonify({
            "success": True,
            "message": "Customer status updated successfully",
            "status": status
        }), 200

    except PyMongoError as error:
        print("Error updating customer status:", error)
        return jsonify({
            "success": False,
            "message": "Unable to update customer status"
        }), 500

# --------------------------------------------------
# 7. CUSTOMER AUTHENTICATION APIs
# --------------------------------------------------


@app.route("/api/auth/register", methods=["POST"])
def register_user():
    data = get_json_body()

    if data is None:
        return error_response("A valid JSON body is required")

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not isinstance(name, str) or not name.strip():
        return error_response("Name is required")

    if not isinstance(email, str):
        return error_response("A valid email is required")

    email = email.strip().lower()

    if (
        len(email) > 254
        or "@" not in email
        or email.startswith("@")
        or email.endswith("@")
    ):
        return error_response("Enter a valid email address")

    if not isinstance(password, str) or len(password) < 8:
        return error_response(
            "Password must contain at least 8 characters"
        )

    if len(password) > 128:
        return error_response("Password is too long")

    try:
        existing_user = users_collection.find_one({"email": email})

        if existing_user:
            return error_response(
                "An account with this email already exists",
                409,
            )

        token, token_hash = create_email_verification_token()

        user = {
            "name": name.strip(),
            "email": email,
            "password": generate_password_hash(password),
            "role": "customer",
            "emailVerified": False,
            "emailVerificationTokenHash": token_hash,
            "emailVerificationExpiresAt": (
                datetime.now(timezone.utc) + timedelta(minutes=30)
            ).isoformat(),
            "createdAt": current_utc_time(),
        }

        result = users_collection.insert_one(user)

        verification_link = (
            f"{FRONTEND_URL}/verify-email?token={token}"
        )

        message = (
            f"Hello {user['name']},\n\n"
            "Thank you for registering with GreenCart.\n"
            "Please verify your email address using the link below:\n\n"
            f"{verification_link}\n\n"
            "This link expires in 30 minutes and can only be used once.\n\n"
            "If you did not create this account, you can ignore this email."
        )

        try:
            send_email(
                email,
                "Verify your GreenCart email address",
                message,
            )
        except Exception as error:
            print("Verification email sending failed:", error)

            # Avoid leaving an unusable account if email delivery fails.
            users_collection.delete_one({"_id": result.inserted_id})

            return error_response(
                "We could not send the verification email. "
                "Please check the email configuration and try again.",
                503,
            )

        return jsonify({
            "success": True,
            "message": (
                "Registration received. Check your email "
                "for the verification link."
            ),
            "requiresEmailVerification": True,
        }), 201

    except PyMongoError as error:
        print("Registration database error:", error)
        return error_response("Unable to register user", 500)


@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = get_json_body()

    if data is None:
        return error_response("A valid JSON body is required")

    email = data.get("email")

    if not isinstance(email, str) or not email.strip():
        return error_response("A valid email is required")

    email = email.strip().lower()

    if (
        len(email) > 254
        or "@" not in email
        or email.startswith("@")
        or email.endswith("@")
    ):
        return error_response("Enter a valid email address")

    message = (
        "If an account exists with this email, "
        "you will receive a password reset link shortly."
    )

    try:
        user = users_collection.find_one({"email": email})

        if not user or user.get("role", "customer") != "customer":
            return jsonify({
                "success": True,
                "message": message,
            }), 200

        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(
            token.encode("utf-8")
        ).hexdigest()

        expiry = (
            datetime.now(timezone.utc) + timedelta(minutes=30)
        ).isoformat()

        users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "passwordResetTokenHash": token_hash,
                    "passwordResetExpiresAt": expiry,
                }
            },
        )

        reset_link = (
            f"{FRONTEND_URL}/reset-password?token={token}"
        )

        email_body = (
            f"Hello {user.get('name', 'GreenCart customer')},\n\n"
            "We received a request to reset your GreenCart password.\n\n"
            "Open this link to choose a new password:\n"
            f"{reset_link}\n\n"
            "This link expires in 30 minutes and can only be used once.\n"
            "If you did not request this reset, you can ignore this email.\n\n"
            "GreenCart Team"
        )

        try:
            send_email(
                email,
                "Reset Your GreenCart Password",
                email_body,
            )
        except Exception as error:
            print("Password reset email sending failed:", error)

            users_collection.update_one(
                {
                    "_id": user["_id"],
                    "passwordResetTokenHash": token_hash,
                },
                {
                    "$unset": {
                        "passwordResetTokenHash": "",
                        "passwordResetExpiresAt": "",
                    }
                },
            )

            return error_response(
                "Unable to send the reset email. Please try again later.",
                503,
            )

        return jsonify({
            "success": True,
            "message": message,
        }), 200

    except PyMongoError as error:
        print("Forgot password database error:", error)
        return error_response(
            "Unable to process your request right now.",
            500,
        )


@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    data = get_json_body()

    if data is None:
        return error_response("A valid JSON body is required")

    token = data.get("token")
    new_password = data.get("password")

    if not isinstance(token, str) or not token.strip():
        return error_response("A valid reset token is required")

    if not isinstance(new_password, str) or len(new_password) < 8:
        return error_response(
            "Password must contain at least 8 characters"
        )

    if len(new_password) > 128:
        return error_response("Password is too long")

    token_hash = hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()

    try:
        user = users_collection.find_one({
            "passwordResetTokenHash": token_hash
        })

        if not user:
            return error_response(
                "This reset link is invalid or has expired.",
                400,
            )

        expiry_value = user.get("passwordResetExpiresAt")

        try:
            expiry = datetime.fromisoformat(expiry_value)
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
        except (TypeError, ValueError):
            return error_response(
                "This reset link is invalid or has expired.",
                400,
            )

        if datetime.now(timezone.utc) >= expiry:
            users_collection.update_one(
                {
                    "_id": user["_id"],
                    "passwordResetTokenHash": token_hash,
                },
                {
                    "$unset": {
                        "passwordResetTokenHash": "",
                        "passwordResetExpiresAt": "",
                    }
                },
            )
            return error_response(
                "This reset link is invalid or has expired.",
                400,
            )

        result = users_collection.update_one(
            {
                "_id": user["_id"],
                "passwordResetTokenHash": token_hash,
                "passwordResetExpiresAt": expiry_value,
            },
            {
                "$set": {
                    "password": generate_password_hash(new_password)
                },
                "$unset": {
                    "passwordResetTokenHash": "",
                    "passwordResetExpiresAt": "",
                },
            },
        )

        if result.modified_count != 1:
            return error_response(
                "This reset link is invalid or has already been used.",
                400,
            )

        return jsonify({
            "success": True,
            "message": (
                "Password reset successfully. Please log in."
            ),
        }), 200

    except PyMongoError as error:
        print("Reset password database error:", error)
        return error_response(
            "Unable to reset your password right now.",
            500,
        )


@app.route("/api/auth/verify-email", methods=["POST"])
def verify_email():
    data = get_json_body()

    if data is None:
        return error_response("A valid JSON body is required")

    token = data.get("token")

    if not isinstance(token, str) or not token:
        return error_response("Verification token is required")

    token_hash = hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()

    try:
        user = users_collection.find_one({
            "emailVerificationTokenHash": token_hash,
            "emailVerified": False,
        })

        if not user:
            return error_response(
                "This verification link is invalid or has already been used.",
                400,
            )

        expiry_value = user.get("emailVerificationExpiresAt")

        try:
            expiry_time = datetime.fromisoformat(expiry_value)
        except (TypeError, ValueError):
            return error_response(
                "This verification link is invalid. Please request a new one.",
                400,
            )

        if expiry_time.tzinfo is None:
            expiry_time = expiry_time.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) >= expiry_time:
            return error_response(
                "This verification link has expired. Please request a new one.",
                400,
            )

        users_collection.update_one(
            {
                "_id": user["_id"],
                "emailVerificationTokenHash": token_hash,
                "emailVerified": False,
            },
            {
                "$set": {
                    "emailVerified": True,
                    "emailVerifiedAt": current_utc_time(),
                },
                "$unset": {
                    "emailVerificationTokenHash": "",
                    "emailVerificationExpiresAt": "",
                },
            },
        )

        return jsonify({
            "success": True,
            "message": (
                "Email verified successfully! You can now log in."
            ),
        }), 200

    except PyMongoError as error:
        print("Email verification database error:", error)
        return error_response(
            "Unable to verify your email right now.",
            500,
        )

@app.route("/api/auth/login", methods=["POST"])
def login_user():
    data = get_json_body()

    if data is None:
        return error_response("A valid JSON body is required")

    email = data.get("email")
    password = data.get("password")

    if not isinstance(email, str) or not isinstance(password, str):
        return error_response("Email and password are required")

    try:
        user = users_collection.find_one({
            "email": email.strip().lower()
        })

        # Check email and password first
        if (
            not user
            or not check_password_hash(
                user["password"],
                password,
            )
        ):
            return error_response(
                "Invalid email or password",
                401,
            )
        
        # Require email verification for new customer accounts.
        # Keep older accounts without this field compatible.
        if (
            user.get("role", "customer") == "customer"
            and user.get("emailVerified", True) is not True
        ):
            return error_response(
                "Please verify your email before logging in.",
                403,
            )

        # Reject inactive customer accounts
        if (
            user.get("role", "customer") == "customer"
            and user.get("status", "Active") == "Inactive"
        ):
            return error_response(
                "Your account is inactive. Please contact the administrator.",
                403,
            )

        access_token = create_access_token(
            identity=str(user["_id"])
        )

        return jsonify({
            "success": True,
            "message": "Login successful",
            "access_token": access_token,
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "role": user.get("role", "customer"),
            },
        }), 200

    except PyMongoError as error:
        print("Login error:", error)
        return error_response("Unable to log in", 500)

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = get_json_body()

    if data is None:
        return error_response("A valid JSON body is required")

    email = data.get("email")
    password = data.get("password")

    if not isinstance(email, str) or not isinstance(password, str):
        return error_response("Email and password are required")

    try:
        user = users_collection.find_one({
            "email": email.strip().lower()
        })

        # Reject missing users and non-admin accounts
        if (
            not user
            or user.get("role") != "admin"
            or not check_password_hash(
                user["password"],
                password,
            )
        ):
            return error_response(
                "Invalid admin email or password",
                401,
            )

        access_token = create_access_token(
            identity=str(user["_id"])
        )

        return jsonify({
            "success": True,
            "message": "Admin login successful",
            "access_token": access_token,
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "role": "admin",
            },
        }), 200

    except PyMongoError as error:
        print("Admin login error:", error)
        return error_response("Unable to log in", 500)


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()

    try:
        user = find_document_by_id(
            users_collection,
            user_id,
        )

        if not user:
            return error_response("User not found", 404)

        return jsonify({
            "success": True,
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "role": user.get("role", "customer"),
            },
        }), 200

    except PyMongoError as error:
        print("Profile error:", error)
        return error_response("Unable to fetch profile", 500)


# --------------------------------------------------
# 8. ORDER APIs
# --------------------------------------------------

@app.route("/api/orders", methods=["POST"])
@jwt_required()
def create_order():
    data = get_json_body()
    user_id = get_jwt_identity()
    
    # Check the customer's current status in MongoDB
    customer_account = find_document_by_id(
        users_collection,
        user_id,
    )

    if not customer_account:
        return error_response("Customer account not found", 404)

    if (
        customer_account.get("role", "customer") == "customer"
        and customer_account.get("status", "Active") == "Inactive"
    ):
        return error_response(
            "Your account is inactive. You cannot place orders.",
            403,
        )

    if data is None:
        return error_response("A valid JSON body is required")

    items = data.get("items")

    if not isinstance(items, list) or not items:
        return error_response("Order must contain at least one item")

    customer = data.get("customer")
    shipping_address = data.get("shippingAddress")

    if not isinstance(customer, dict):
        return error_response("Customer details are required")

    if not isinstance(shipping_address, dict):
        return error_response("Shipping address is required")

    for field in ("fullName", "email", "phone"):
        if not isinstance(customer.get(field), str) or not customer[field].strip():
            return error_response(f"Customer {field} is required")

    for field in ("address", "city", "state", "pincode"):
        if not isinstance(shipping_address.get(field), str) or not shipping_address[field].strip():
            return error_response(f"Shipping {field} is required")

    # Recalculate prices from MongoDB rather than trusting the browser.
    verified_items = []
    subtotal = 0

    try:
        for item in items:
            if not isinstance(item, dict):
                return error_response("Invalid order item")

            product_id = str(
                item.get("productId")
                or item.get("id")
                or item.get("_id")
                or ""
            )

            try:
                quantity = int(item.get("quantity"))
            except (TypeError, ValueError, OverflowError):
                return error_response("Invalid product quantity")

            if quantity <= 0:
                return error_response("Quantity must be positive")

            product = find_document_by_id(
                products_collection,
                product_id,
            )

            if not product:
                return error_response(
                    f"Product not found: {product_id}",
                    404,
                )

            if product.get("status", "Active") != "Active":
                return error_response(
                    f"{product.get('name', 'Product')} is currently inactive and cannot be ordered.",
                    400,
                )

            stock = int(product.get("stock", 0))
            
            if quantity > stock:
                return error_response(
                    f"Not enough stock for {product.get('name', 'product')}",
                    409,
                )

            price = float(product.get("price", 0))

                        # Calculate purchase and reminder dates
            purchase_date = datetime.now(timezone.utc)

            usage_days = product.get("estimatedUsageDays")
            repurchase_reminder_date = None

            if isinstance(usage_days, int) and not isinstance(usage_days, bool) and usage_days > 0:
                reminder_days = max(usage_days - 5, 1)

                repurchase_reminder_date = (
                    purchase_date + timedelta(days=reminder_days)
                ).isoformat()

            verified_items.append({
                "productId": str(product["_id"]),
                "name": product.get("name", ""),
                "price": price,
                "quantity": quantity,
                "image": product.get("image", ""),
                "expiryDate": product.get("expiryDate"),
                "purchaseDate": purchase_date.isoformat(),
                "repurchaseReminderDate": repurchase_reminder_date,
                "reminderSent": False,
            })

            subtotal += price * quantity

        delivery_charge = 0 if subtotal >= 499 else 40

        # Validate and calculate coupon discount on the server.
        coupon_code = str(data.get("couponCode", "")).strip().upper()
        discount = 0

        coupons = {
            "GREEN10": {"type": "percentage", "value": 10},
            "SAVE50": {"type": "fixed", "value": 50},
        }

        if coupon_code:
            coupon = coupons.get(coupon_code)

            if not coupon:
                return error_response("Invalid coupon code")

            if coupon["type"] == "percentage":
                discount = round(subtotal * coupon["value"] / 100, 2)
            else:
                discount = min(coupon["value"], subtotal)

        total_amount = max(0, subtotal + delivery_charge - discount)

        # Atomic stock decrements help prevent overselling.
        # If any decrement fails, restore earlier decrements.
        decremented = []

        try:
            for item in verified_items:
                product_id = item["productId"]
                quantity = item["quantity"]

                result = products_collection.update_one(
                {
                    "_id": ObjectId(product_id),
                    "stock": {"$gte": quantity},
                    "$or": [
                        {"status": "Active"},
                        {"status": {"$exists": False}},
                        {"status": None},
                    ],
                },
                {"$inc": {"stock": -quantity}},
            )
                
                if result.modified_count != 1:
                    raise ValueError(
                        f"Stock changed for {item['name']}. Please try again."
                    )

                decremented.append((product_id, quantity))

            order = {
                "userId": user_id,
                "customer": customer,
                "shippingAddress": shipping_address,
                "items": verified_items,
                "subtotal": subtotal,
                "deliveryCharge": delivery_charge,
                "couponCode": coupon_code or None,
                "discount": discount,
                "totalAmount": total_amount,
                "paymentMethod": data.get(
                    "paymentMethod",
                    "Cash on Delivery",
                ),
                "status": "Pending",
                "orderStatus": "Pending",
                "createdAt": current_utc_time(),
            }

            result = orders_collection.insert_one(order)
            order["_id"] = result.inserted_id
            # Save order notification in MongoDB
            order_id = str(result.inserted_id)

            notifications_collection.update_one(
                {
                    "userId": user_id,
                    "notificationKey": f"order:{order_id}",
                },
                {
                    "$setOnInsert": {
                        "userId": user_id,
                        "notificationKey": f"order:{order_id}",
                        "type": "order",
                        "title": "Order Placed Successfully!",
                        "message": (
                            f"Your order {order_id} has been placed. "
                            "We'll keep you updated on its progress."
                        ),
                        "link": "/my-orders",
                        "orderId": order_id,
                        "createdAt": current_utc_time(),
                        "unread": True,
                    }
                },
                upsert=True,
            )
        except Exception:
            # Restore stock if order creation failed.
            for product_id, quantity in reversed(decremented):
                products_collection.update_one(
                    {"_id": ObjectId(product_id)},
                    {"$inc": {"stock": quantity}},
                )
            raise

        return jsonify({
            "success": True,
            "message": "Order placed successfully",
            "order": serialize_document(order),
        }), 201

    except ValueError as error:
        return error_response(str(error), 409)

    except (PyMongoError, TypeError, OverflowError) as error:
        print("Order creation error:", error)
        return error_response("Unable to create order", 500)


@app.route("/api/notifications/check-reminders", methods=["POST"])
@jwt_required()
def check_customer_reminders():
    user_id = get_jwt_identity()
    now = datetime.now(timezone.utc)

    created_count = 0
    orders = orders_collection.find({"userId": user_id})

    for order in orders:
        order_id = str(order["_id"])

        for index, item in enumerate(order.get("items", [])):
            product_id = item.get("productId")
            product_name = item.get("name", "Product")

            # 1. Check product expiry reminder
            expiry_date = item.get("expiryDate")

            if expiry_date:
                try:
                    expiry_day = datetime.strptime(
                        expiry_date, "%Y-%m-%d"
                    ).date()

                    reminder_day = expiry_day - timedelta(days=7)

                    if now.date() >= reminder_day:
                        reminder_key = f"{order_id}:{index}:expiry"

                        notification = {
                            "userId": user_id,
                            "reminderKey": reminder_key,
                            "type": "expiry",
                            "title": "Product Expiry Reminder",
                            "message": (
                                f"{product_name} expires on "
                                f"{expiry_day.strftime('%d %b %Y')}."
                            ),
                            "productId": product_id,
                            "orderId": order_id,
                            "createdAt": current_utc_time(),
                            "unread": True,
                        }

                        result = notifications_collection.update_one(
                        {
                            "userId": user_id,
                            "reminderKey": reminder_key
                        },
                            {"$setOnInsert": notification},
                            upsert=True,
                        )

                        if result.upserted_id:
                            created_count += 1

                except (TypeError, ValueError):
                    pass

            # 2. Check product repurchase reminder
            repurchase_date = item.get("repurchaseReminderDate")

            if repurchase_date:
                try:
                    reminder_datetime = datetime.fromisoformat(
                        repurchase_date.replace("Z", "+00:00")
                    )

                    if reminder_datetime.tzinfo is None:
                        reminder_datetime = reminder_datetime.replace(
                            tzinfo=timezone.utc
                        )

                    if now >= reminder_datetime:
                        reminder_key = f"{order_id}:{index}:repurchase"

                        notification = {
                            "userId": user_id,
                            "reminderKey": reminder_key,
                            "type": "repurchase",
                            "title": "Time to Reorder!",
                            "message": (
                                f"You may be running low on {product_name}. "
                                "Consider purchasing it again."
                            ),
                            "productId": product_id,
                            "orderId": order_id,
                            "createdAt": current_utc_time(),
                            "unread": True,
                        }

                        result = notifications_collection.update_one(
                            {
                                "userId": user_id,
                                "reminderKey": reminder_key,
                            },
                            {"$setOnInsert": notification},
                            upsert=True,
                        )

                        if result.upserted_id:
                            created_count += 1

                except (TypeError, ValueError):
                    pass

    return jsonify({
        "success": True,
        "message": "Reminder check completed",
        "newNotifications": created_count,
    }), 200
@app.route("/api/notifications", methods=["GET"])
@jwt_required()
def get_customer_notifications():
    user_id = get_jwt_identity()

    notifications = list(
        notifications_collection.find(
            {"userId": user_id}
        ).sort("createdAt", -1)
    )

    unread_count = sum(
        1 for notification in notifications
        if notification.get("unread", True)
    )

    return jsonify({
        "success": True,
        "notifications": [
            serialize_document(notification)
            for notification in notifications
        ],
        "unreadCount": unread_count,
    }), 200

@app.route("/api/notifications/<notification_id>/read", methods=["PATCH"])
@jwt_required()
def mark_notification_as_read(notification_id):
    user_id = get_jwt_identity()

    try:
        notification_object_id = ObjectId(notification_id)
    except Exception:
        return error_response("Invalid notification ID", 400)

    result = notifications_collection.update_one(
        {
            "_id": notification_object_id,
            "userId": user_id,
        },
        {
            "$set": {"unread": False}
        },
    )

    if result.matched_count == 0:
        return error_response("Notification not found", 404)

    return jsonify({
        "success": True,
        "message": "Notification marked as read",
    }), 200

@app.route("/api/notifications/read-all", methods=["PATCH"])
@jwt_required()
def mark_all_notifications_as_read():
    user_id = get_jwt_identity()

    result = notifications_collection.update_many(
        {
            "userId": user_id,
            "unread": True,
        },
        {
            "$set": {"unread": False}
        },
    )

    return jsonify({
        "success": True,
        "message": "All notifications marked as read",
        "updatedCount": result.modified_count,
    }), 200

@app.route("/api/notifications/<notification_id>", methods=["DELETE"])
@jwt_required()
def delete_customer_notification(notification_id):
    user_id = get_jwt_identity()

    try:
        notification_object_id = ObjectId(notification_id)
    except Exception:
        return error_response("Invalid notification ID", 400)

    result = notifications_collection.delete_one({
        "_id": notification_object_id,
        "userId": user_id,
    })

    if result.deleted_count == 0:
        return error_response("Notification not found", 404)

    return jsonify({
        "success": True,
        "message": "Notification deleted successfully",
    }), 200

@app.route("/api/notifications", methods=["DELETE"])
@jwt_required()
def clear_customer_notifications():
    user_id = get_jwt_identity()

    result = notifications_collection.delete_many({
        "userId": user_id,
    })

    return jsonify({
        "success": True,
        "message": "All notifications cleared",
        "deletedCount": result.deleted_count,
    }), 200
            
@app.route("/api/orders", methods=["GET"])
@jwt_required()
def get_orders():
    user_id = get_jwt_identity()

    try:
        orders = [
            serialize_document(order)
            for order in orders_collection.find(
                {"userId": user_id}
            ).sort("_id", -1)
        ]

        return jsonify({
            "success": True,
            "count": len(orders),
            "orders": orders,
        }), 200

    except PyMongoError as error:
        print("Error fetching orders:", error)
        return error_response("Unable to fetch orders", 500)


@app.route("/api/orders/<order_id>", methods=["GET"])
@jwt_required()
def get_order(order_id):
    user_id = get_jwt_identity()

    try:
        order = orders_collection.find_one({
            "_id": ObjectId(order_id),
            "userId": user_id,
        }) if ObjectId.is_valid(order_id) else orders_collection.find_one({
            "id": order_id,
            "userId": user_id,
        })

        if not order:
            return error_response("Order not found", 404)

        return jsonify({
            "success": True,
            "order": serialize_document(order),
        }), 200

    except PyMongoError as error:
        print("Error fetching order:", error)
        return error_response("Unable to fetch order", 500)



@app.route("/api/admin/orders", methods=["GET"])
@admin_required()
def get_admin_orders():
    try:
        orders = [
            serialize_document(order)
            for order in orders_collection.find().sort("_id", -1)
        ]

        return jsonify({
            "success": True,
            "count": len(orders),
            "orders": orders,
        }), 200

    except PyMongoError as error:
        print("Error fetching admin orders:", error)
        return error_response("Unable to fetch orders", 500)


@app.route(
    "/api/orders/<order_id>/status",
    methods=["PATCH"],
)
@admin_required()
def update_order_status(order_id):
    data = get_json_body()

    if data is None:
        return error_response("A valid JSON body is required")

    status = data.get("status") or data.get("orderStatus")

    allowed_statuses = {
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
    }

    if status not in allowed_statuses:
        return error_response("Invalid order status")

    query = (
        {"_id": ObjectId(order_id)}
        if ObjectId.is_valid(order_id)
        else {"id": order_id}
    )

    try:
        # Find the existing order first.
        existing_order = orders_collection.find_one(query)

        if existing_order is None:
            return error_response("Order not found", 404)

        current_status = (
            existing_order.get("status")
            or existing_order.get("orderStatus")
            or "Pending"
        )

        # Do not reopen a cancelled order automatically.
        # Its stock has already been restored.
        if current_status == "Cancelled" and status != "Cancelled":
            return error_response(
                "A cancelled order cannot be reopened automatically",
                400,
            )

        # Repeated cancellation must not restore stock again.
        if current_status == "Cancelled" and status == "Cancelled":
            return jsonify({
                "success": True,
                "message": "Order is already cancelled",
                "order": serialize_document(existing_order),
            }), 200

        # Restore stock only when changing to Cancelled.
        if status == "Cancelled":
            restored_products = []

            try:
                for item in existing_order.get("items", []):
                    product_id = item.get("productId")
                    quantity = item.get("quantity", 0)

                    if (
                        not product_id
                        or isinstance(quantity, bool)
                        or not isinstance(quantity, (int, float))
                        or quantity <= 0
                        or not float(quantity).is_integer()
                    ):
                        raise ValueError(
                            "Invalid product or quantity in order"
                        )

                    product_query = (
                        {"_id": ObjectId(product_id)}
                        if ObjectId.is_valid(str(product_id))
                        else {"id": product_id}
                    )

                    result = products_collection.update_one(
                        product_query,
                        {"$inc": {"stock": int(quantity)}},
                    )

                    if result.matched_count == 0:
                        raise ValueError(
                            f"Product not found: {product_id}"
                        )

                    restored_products.append(
                        (product_query, int(quantity))
                    )

            except (PyMongoError, ValueError, TypeError) as error:
                # Roll back any stock increments already performed.
                for product_query, quantity in reversed(restored_products):
                    try:
                        products_collection.update_one(
                            product_query,
                            {"$inc": {"stock": -quantity}},
                        )
                    except PyMongoError as rollback_error:
                        print(
                            "Stock rollback failed:",
                            rollback_error,
                        )

                print("Error restoring order stock:", error)
                return error_response(
                    "Unable to restore stock. Order was not cancelled.",
                    500,
                )

        # Update the order after stock restoration.
        result = orders_collection.update_one(
            {
                **query,
                "status": {"$ne": "Cancelled"},
                "orderStatus": {"$ne": "Cancelled"},
            },
            {
                "$set": {
                    "status": status,
                    "orderStatus": status,
                    "updatedAt": current_utc_time(),
                }
            },
        )

        if result.matched_count == 0:
            # The order may have changed concurrently. Roll back stock.
            if status == "Cancelled":
                for item in existing_order.get("items", []):
                    product_id = item.get("productId")
                    quantity = int(item.get("quantity", 0))

                    product_query = (
                        {"_id": ObjectId(product_id)}
                        if ObjectId.is_valid(str(product_id))
                        else {"id": product_id}
                    )

                    products_collection.update_one(
                        product_query,
                        {"$inc": {"stock": -quantity}},
                    )

            return error_response(
                "Order status changed. Refresh and try again.",
                409,
            )

        order = serialize_document(
            orders_collection.find_one(query)
        )

        return jsonify({
            "success": True,
            "message": "Order status updated successfully",
            "order": order,
        }), 200

    except PyMongoError as error:
        print("Error updating order status:", error)
        return error_response("Unable to update order status", 500)


# --------------------------------------------------
# 9. START SERVER
# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
    )
