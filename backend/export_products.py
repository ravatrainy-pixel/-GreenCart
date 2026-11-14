import json
from app import products_collection

products = list(products_collection.find({}, {"_id": 0}))

with open("products_list.json", "w", encoding="utf-8") as file:
    json.dump(products, file, indent=2, ensure_ascii=False, default=str)

print(f"Exported {len(products)} products to products_list.json")