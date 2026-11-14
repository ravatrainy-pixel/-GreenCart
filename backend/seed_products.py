
import os
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError

# Load the existing backend .env file.
load_dotenv(Path(__file__).with_name(".env"))

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://127.0.0.1:27017/greencart",
)

DATABASE_NAME = "greencart"

# Demo products use your existing product schema.
# Categories must already exist in MongoDB.

SEED_PRODUCTS = [
    # ---------------- SKIN CARE ----------------
    {
        "name": "Pure Aloe Vera Gel",
        "category": "Skin Care",
        "price": 199,
        "stock": 50,
        "description": "Lightweight aloe vera gel for everyday skin hydration.",
        "status": "Active",
        "image": "",
        
    },
    {
        "name": "Herbal Face Wash",
        "category": "Skin Care",
        "price": 249,
        "stock": 40,
        "description": "Daily facial cleanser with a botanical-inspired formula.",
        "status": "Active",
        "image": "",
        
    },
    {
        "name": "Natural Face Scrub",
        "category": "Skin Care",
        "price": 229,
        "stock": 35,
        "description": "Gentle exfoliating scrub for a refreshing skincare routine.",
        "status": "Active",
        "image": "",
        
    },
    {
        "name": "Rose Water Toner",
        "category": "Skin Care",
        "price": 149,
        "stock": 45,
        "description": "Refreshing rose water toner for daily skincare.",
        "status": "Active",
        "image": "",
        
    },
    {
        "name": "Vitamin C Face Serum",
        "category": "Skin Care",
        "price": 399,
        "stock": 25,
        "description": "Lightweight facial serum for a brighter-looking complexion.",
        "status": "Active",
        "image": "",
        
    },
    {
        "name": "Shea Butter Moisturizer",
        "category": "Skin Care",
        "price": 329,
        "stock": 30,
        "description": "Rich moisturizer designed to soften dry-feeling skin.",
        "status": "Active",
        "image": "",
        
    },
    {
        "name": "Mineral Sunscreen SPF 30",
        "category": "Skin Care",
        "price": 449,
        "stock": 25,
        "description": "Daily mineral sunscreen for broad-spectrum sun protection.",
        "status": "Active",
        "image": "",
        
    },
    {
        "name": "Oatmeal Face Mask",
        "category": "Skin Care",
        "price": 279,
        "stock": 20,
        "description": "Creamy oatmeal-inspired mask for a relaxing skincare routine.",
        "status": "Active",
        "image": "",
        
    },
    {
        "name": "Jojoba Face Oil",
        "category": "Skin Care",
        "price": 349,
        "stock": 20,
        "description": "Light facial oil for a nourishing skincare routine.",
        "status": "Active",
        "image": "",
    
    },
    {
        "name": "Natural Lip Balm",
        "category": "Skin Care",
        "price": 99,
        "stock": 60,
        "description": "Compact moisturizing lip balm for everyday use.",
        "status": "Active",
        "image": "",
        
    },

    # ---------------- HAIR CARE ----------------
    {
        "name": "Coconut Hair Oil",
        "category": "Hair Care",
        "price": 179,
        "stock": 45,
        "description": "Coconut hair oil for a traditional hair-care routine.",
        "status": "Active",
        "image": "",
        
    },
    # Hair Care Products
    {
        "name": "Herbal Shampoo",
        "category": "Hair Care",
        "price": 249,
        "stock": 30,
        "description": "A gentle herbal shampoo for everyday hair cleansing.",
        "status": "Active",
        "image": "",
        
    },
    {
        "name": "Coconut Hair Oil",
        "category": "Hair Care",
        "price": 199,
        "stock": 25,
        "description": "Nourishing coconut hair oil for a smooth hair-care routine.",
        "status": "Active",
        "image": "",
        
    },
    {
        "name": "Argan Hair Serum",
        "category": "Hair Care",
        "price": 349,
        "stock": 20,
        "description": "Lightweight hair serum to help smooth frizz and add shine.",
        "status": "Active",
        "image": "",
        
    },
    {
        "name": "Deep Conditioning Hair Mask",
        "category": "Hair Care",
        "price": 399,
        "stock": 18,
        "description": "A conditioning hair mask for softer, more manageable hair.",
        "status": "Active",
        "image": "",
        
    },
    {
        "name": "Aloe Hair Conditioner",
        "category": "Hair Care",
        "price": 279,
        "stock": 24,
        "description": "An aloe-based conditioner to help detangle and soften hair.",
        "status": "Active",
        "image": "",
        
    },
    {
        "name": "Amla Hair Oil",
        "category": "Hair Care",
        "price": 229,
        "stock": 22,
        "description": "Traditional amla hair oil for a nourishing hair-care routine.",
        "status": "Active",
        "image": ""
    },
    {
        "name": "Neem Scalp Shampoo",
        "category": "Hair Care",
        "price": 299,
        "stock": 20,
        "description": "A neem-inspired shampoo for cleansing the scalp.",
        "status": "Active",
        "image": ""
    },
    {
        "name": "Keratin Smooth Hair Serum",
        "category": "Hair Care",
        "price": 379,
        "stock": 15,
        "description": "A smoothing serum designed to improve the appearance of frizzy hair.",
        "status": "Active",
        "image": ""
    },
    {
        "name": "Onion Hair Oil",
        "category": "Hair Care",
        "price": 249,
        "stock": 25,
        "description": "Onion-infused hair oil for a regular scalp and hair-care routine.",
        "status": "Active",
        "image": ""
    },
    {
        "name": "Argan Repair Hair Mask",
        "category": "Hair Care",
        "price": 449,
        "stock": 16,
        "description": "A rich conditioning mask for dry and damaged-looking hair.",
        "status": "Active",
        "image": ""
    },
    {
        "name": "Tea Tree Scalp Cleanser",
        "category": "Hair Care",
        "price": 329,
        "stock": 18,
        "description": "A scalp cleanser formulated for a refreshing wash routine.",
        "status": "Active",
        "image": ""
    },
    {
        "name": "Rosemary Hair Serum",
        "category": "Hair Care",
        "price": 399,
        "stock": 20,
        "description": "A lightweight rosemary-infused serum for everyday hair care.",
        "status": "Active",
        "image": ""
    },
    {
        "name": "Castor Hair Oil",
        "category": "Hair Care",
        "price": 189,
        "stock": 28,
        "description": "A rich castor oil product for scalp and hair nourishment.",
        "status": "Active",
        "image": ""
    },
    {
        "name": "Leave-In Hair Conditioner",
        "category": "Hair Care",
        "price": 349,
        "stock": 18,
        "description": "A leave-in conditioner to help reduce tangles and improve manageability.",
        "status": "Active",
        "image": ""
    },
    {
        "name": "Bamboo Paddle Hairbrush",
        "category": "Hair Care",
        "price": 299,
        "stock": 20,
        "description": "A reusable bamboo hairbrush for everyday grooming.",
        "status": "Active",
        "image": ""
    },
    {
        "name": "Herbal Shampoo",
        "category": "Hair Care",
        "price": 299,
        "stock": 30,
        "description": "Everyday shampoo with a botanical-inspired formula.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Aloe Hair Conditioner",
        "category": "Hair Care",
        "price": 279,
        "stock": 25,
        "description": "Conditioner to help leave hair feeling soft and manageable.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Wooden Hair Comb",
        "category": "Hair Care",
        "price": 99,
        "stock": 60,
        "description": "Reusable wooden comb for everyday grooming.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Argan Hair Serum",
        "category": "Hair Care",
        "price": 349,
        "stock": 25,
        "description": "Smoothing hair serum for a polished-looking finish.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Amla Hair Oil",
        "category": "Hair Care",
        "price": 199,
        "stock": 40,
        "description": "Amla-inspired hair oil for regular scalp and hair care.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Deep Conditioning Hair Mask",
        "category": "Hair Care",
        "price": 399,
        "stock": 20,
        "description": "Rich conditioning mask for dry-feeling hair.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Neem Scalp Shampoo",
        "category": "Hair Care",
        "price": 269,
        "stock": 30,
        "description": "Neem-inspired shampoo for a refreshing scalp-care routine.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Reusable Hair Scrunchies",
        "category": "Hair Care",
        "price": 129,
        "stock": 50,
        "description": "Soft fabric scrunchies for everyday hairstyles.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Bamboo Paddle Hairbrush",
        "category": "Hair Care",
        "price": 299,
        "stock": 25,
        "description": "Bamboo-handled paddle brush for everyday detangling.",
        "status": "Active",
        "image": "",
    },

    # ---------------- ORGANIC SNACKS ----------------
    {
        "name": "Organic Roasted Almonds",
        "category": "Organic Snacks",
        "price": 299,
        "stock": 35,
        "description": "Roasted almonds for a convenient crunchy snack.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Organic Trail Mix",
        "category": "Organic Snacks",
        "price": 249,
        "stock": 30,
        "description": "A snack mix of nuts, seeds, and dried fruit.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Honey Granola",
        "category": "Organic Snacks",
        "price": 279,
        "stock": 25,
        "description": "Crunchy granola with oats and a touch of honey.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Dried Mango Slices",
        "category": "Organic Snacks",
        "price": 199,
        "stock": 35,
        "description": "Chewy dried mango slices for a fruity snack.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Pumpkin Seed Snack Pack",
        "category": "Organic Snacks",
        "price": 159,
        "stock": 40,
        "description": "Crunchy pumpkin seeds in a convenient snack pack.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Roasted Makhana",
        "category": "Organic Snacks",
        "price": 149,
        "stock": 45,
        "description": "Light roasted fox nuts for a crunchy snack.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Organic Peanut Butter",
        "category": "Organic Snacks",
        "price": 329,
        "stock": 25,
        "description": "Creamy peanut spread for toast, fruit, and smoothies.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Multigrain Crackers",
        "category": "Organic Snacks",
        "price": 179,
        "stock": 35,
        "description": "Crisp multigrain crackers for snack time.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Dried Cranberry Mix",
        "category": "Organic Snacks",
        "price": 229,
        "stock": 30,
        "description": "Sweet-tart dried cranberries for snacks and breakfast bowls.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Date and Nut Energy Bites",
        "category": "Organic Snacks",
        "price": 199,
        "stock": 30,
        "description": "Bite-sized date and nut snacks for convenient energy.",
        "status": "Active",
        "image": "",
    },

    # ---------------- CLOTHING ----------------
    {
        "name": "Organic Cotton T-Shirt",
        "category": "Clothing",
        "price": 499,
        "stock": 30,
        "description": "Everyday cotton T-shirt with a comfortable regular fit.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Linen Casual Shirt",
        "category": "Clothing",
        "price": 899,
        "stock": 20,
        "description": "Lightweight linen-style shirt for casual outfits.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Cotton Everyday Dress",
        "category": "Clothing",
        "price": 999,
        "stock": 15,
        "description": "Simple cotton dress for comfortable everyday wear.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Reusable Canvas Tote",
        "category": "Clothing",
        "price": 249,
        "stock": 40,
        "description": "Reusable canvas tote for shopping and daily essentials.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Cotton Lounge Pants",
        "category": "Clothing",
        "price": 599,
        "stock": 25,
        "description": "Relaxed-fit cotton lounge pants for everyday comfort.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Linen Blend Scarf",
        "category": "Clothing",
        "price": 399,
        "stock": 20,
        "description": "Lightweight scarf for layering and styling.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Organic Cotton Socks",
        "category": "Clothing",
        "price": 199,
        "stock": 45,
        "description": "Soft everyday cotton socks.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Cotton Kurta",
        "category": "Clothing",
        "price": 799,
        "stock": 20,
        "description": "Comfortable cotton kurta for casual and festive wear.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Lightweight Cotton Hoodie",
        "category": "Clothing",
        "price": 899,
        "stock": 15,
        "description": "Casual cotton hoodie for relaxed everyday outfits.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Reusable Fabric Produce Bags",
        "category": "Clothing",
        "price": 179,
        "stock": 35,
        "description": "Washable fabric bags for carrying produce and small items.",
        "status": "Active",
        "image": "",
    },

    # ---------------- HOME ESSENTIALS ----------------
    {
        "name": "Bamboo Toothbrush",
        "category": "Home Essentials",
        "price": 99,
        "stock": 60,
        "description": "Bamboo-handled toothbrush for everyday oral care.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Reusable Cotton Tote Bag",
        "category": "Home Essentials",
        "price": 149,
        "stock": 40,
        "description": "Reusable tote bag for shopping and daily errands.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Reusable Glass Storage Jar",
        "category": "Home Essentials",
        "price": 199,
        "stock": 25,
        "description": "Glass storage jar for pantry and household essentials.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Bamboo Kitchen Brush",
        "category": "Home Essentials",
        "price": 129,
        "stock": 35,
        "description": "Reusable bamboo-handled brush for kitchen cleaning.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Stainless Steel Water Bottle",
        "category": "Home Essentials",
        "price": 399,
        "stock": 25,
        "description": "Reusable water bottle for home, college, and travel.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Beeswax Food Wraps",
        "category": "Home Essentials",
        "price": 249,
        "stock": 30,
        "description": "Reusable food wraps for covering bowls and packing snacks.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Bamboo Kitchen Towel Set",
        "category": "Home Essentials",
        "price": 299,
        "stock": 25,
        "description": "Reusable kitchen towels for everyday cleaning and drying.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Coconut Coir Scrub Pads",
        "category": "Home Essentials",
        "price": 99,
        "stock": 45,
        "description": "Coconut coir scrub pads for household cleaning tasks.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Reusable Silicone Food Bags",
        "category": "Home Essentials",
        "price": 349,
        "stock": 20,
        "description": "Reusable food storage bags for snacks and leftovers.",
        "status": "Active",
        "image": "",
    },
    {
        "name": "Bamboo Desk Organizer",
        "category": "Home Essentials",
        "price": 449,
        "stock": 20,
        "description": "Bamboo organizer for stationery and small desk essentials.",
        "status": "Active",
        "image": "",
    },
]



def seed_products():
    client = None

    try:
        client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=10000,
        )

        # Confirm that MongoDB is reachable.
        client.admin.command("ping")

        db = client[DATABASE_NAME]
        products_collection = db["products"]
        categories_collection = db["categories"]

        existing_categories = {
            category["name"]
            for category in categories_collection.find(
                {},
                {"name": 1},
            )
            if category.get("name")
        }

        if not existing_categories:
            print(
                "No categories found in MongoDB. "
                "Create categories in Admin → Categories first."
            )
            return

        inserted = 0
        already_present = 0
        missing_categories = set()

        for product in SEED_PRODUCTS:
            category_name = product["category"]

            if category_name not in existing_categories:
                missing_categories.add(category_name)
                continue

            # Avoid duplicates when this script is run again.
            # Existing admin-created products are not overwritten.
            existing_product = products_collection.find_one(
                {
                    "name": product["name"],
                    "category": category_name,
                },
                {"_id": 1},
            )

            if existing_product:
                already_present += 1
                continue

            now = datetime.now(timezone.utc)

            document = {
                **product,
                "createdAt": now,
                "updatedAt": now,
                "seedSource": "demo",
            }

            products_collection.insert_one(document)
            inserted += 1
            print(f"Added: {product['name']}")

        print("\nSeed process completed.")
        print(f"New products inserted: {inserted}")
        print(f"Already present: {already_present}")

        if missing_categories:
            print("\nSkipped because categories do not exist:")
            for category_name in sorted(missing_categories):
                print(f"- {category_name}")

        print(
            "\nTotal products in MongoDB:",
            products_collection.count_documents({}),
        )

    except PyMongoError as error:
        print("MongoDB error:", error)
        print(
            "Check your MongoDB connection and the MONGO_URI "
            "in your existing backend .env file."
        )

    finally:
        if client is not None:
            client.close()


if __name__ == "__main__":
    seed_products()
