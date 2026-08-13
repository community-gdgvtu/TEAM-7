import os
import time
from pymongo import MongoClient

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://panchayat_app:98fWymt0AGFHiVLqOqZImQ@cluster0.5rrxf0y.mongodb.net/panchayat_ai"
)

client = MongoClient(MONGODB_URI)
db = client["panchayat_ai"]

def seed_database():
    print("🌱 Seeding Panchayat AI MongoDB Atlas Database...")

    # 1. Seed Sellers
    sellers_col = db["sellers"]
    sellers_col.delete_many({}) # Clean seed

    initial_sellers = [
        {
            "_id": "seller-1",
            "name": "Sri Lakshmi Electronics & Computers",
            "category": "Computers",
            "location": "Hulkoti Market, Gadag",
            "address": "Main Road Near Bus Stand, Hulkoti",
            "distance_km": 0.8,
            "rating": 4.8,
            "verification_status": "VERIFIED",
            "response_rate": 98,
            "tenure_years": 7,
            "deals_completed": 412,
            "base_price_multiplier": 1.08,
            "flexibility": 12.0,
            "warranty_offered": "1 Year Brand + 6 Mo Shop Warranty",
            "stock_status": "IN_STOCK",
            "delivery_offered": True,
            "phone": "+91 98452 11092"
        },
        {
            "_id": "seller-2",
            "name": "Gadag Digital Hub & Laptops",
            "category": "Computers",
            "location": "Station Road, Gadag",
            "address": "Opposite Railway Station, Gadag",
            "distance_km": 2.5,
            "rating": 4.6,
            "verification_status": "PREMIUM",
            "response_rate": 95,
            "tenure_years": 5,
            "deals_completed": 289,
            "base_price_multiplier": 1.05,
            "flexibility": 15.0,
            "warranty_offered": "1 Year Brand Warranty",
            "stock_status": "IN_STOCK",
            "delivery_offered": True,
            "phone": "+91 98450 44819"
        },
        {
            "_id": "seller-3",
            "name": "Panchayat Tech Plaza",
            "category": "Computers",
            "location": "Hulkoti Market, Gadag",
            "address": "Panchayat Complex, Hulkoti",
            "distance_km": 0.5,
            "rating": 4.9,
            "verification_status": "PREMIUM",
            "response_rate": 99,
            "tenure_years": 8,
            "deals_completed": 530,
            "base_price_multiplier": 1.03,
            "flexibility": 18.0,
            "warranty_offered": "2 Years Full Warranty + Free Accessories",
            "stock_status": "IN_STOCK",
            "delivery_offered": True,
            "phone": "+91 98455 33021"
        },
        {
            "_id": "seller-4",
            "name": "Hulkoti Laptop Zone",
            "category": "Computers",
            "location": "Market Circle, Gadag",
            "address": "Shop No 14, Market Circle, Gadag",
            "distance_km": 3.1,
            "rating": 4.4,
            "verification_status": "VERIFIED",
            "response_rate": 91,
            "tenure_years": 4,
            "deals_completed": 195,
            "base_price_multiplier": 1.10,
            "flexibility": 10.0,
            "warranty_offered": "1 Year Brand Warranty",
            "stock_status": "IN_STOCK",
            "delivery_offered": False,
            "phone": "+91 98458 90123"
        }
    ]

    sellers_col.insert_many(initial_sellers)
    print(f"✅ Successfully seeded {len(initial_sellers)} merchant profiles.")

    # 2. Create Indexes
    sellers_col.create_index([("category", 1), ("rating", -1), ("distance_km", 1)])
    db["users"].create_index("email", unique=True)
    db["negotiation_sessions"].create_index([("created_at", -1)])
    db["fact_bus"].create_index([("sessionId", 1), ("timestamp", 1)])
    print("✅ Performance indexes created successfully.")

if __name__ == "__main__":
    seed_database()
