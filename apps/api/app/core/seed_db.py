import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import sellers_col, products_col, get_database_status

EXPANDED_SELLERS = [
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
        "phone": "+91 98452 11092",
        "latitude": 15.4328,
        "longitude": 75.6318
    },
    {
        "_id": "seller-2",
        "name": "Honnur Digital World",
        "category": "Computers",
        "location": "Station Road, Gadag",
        "address": "Shop #14, Super Market Complex, Gadag",
        "distance_km": 2.4,
        "rating": 4.7,
        "verification_status": "PREMIUM",
        "response_rate": 95,
        "tenure_years": 9,
        "deals_completed": 530,
        "base_price_multiplier": 1.05,
        "flexibility": 10.0,
        "warranty_offered": "1 Year Official Brand Warranty",
        "stock_status": "IN_STOCK",
        "delivery_offered": True,
        "phone": "+91 94481 33401",
        "latitude": 15.4350,
        "longitude": 75.6350
    },
    {
        "_id": "seller-3",
        "name": "Basaveshwar Tech & Laptop Hub",
        "category": "Computers",
        "location": "Hulkoti",
        "address": "Near Old Panchayat Office, Hulkoti",
        "distance_km": 1.5,
        "rating": 4.4,
        "verification_status": "VERIFIED",
        "response_rate": 91,
        "tenure_years": 4,
        "deals_completed": 184,
        "base_price_multiplier": 1.12,
        "flexibility": 14.0,
        "warranty_offered": "1 Year Warranty + Free Backpack",
        "stock_status": "IN_STOCK",
        "delivery_offered": False,
        "phone": "+91 97312 88231",
        "latitude": 15.4310,
        "longitude": 75.6290
    },
    {
        "_id": "seller-4",
        "name": "City Mart Tech Zone",
        "category": "Computers",
        "location": "KC Circle, Gadag",
        "address": "Opp. APMC Market Gate, Gadag",
        "distance_km": 4.8,
        "rating": 4.2,
        "verification_status": "VERIFIED",
        "response_rate": 88,
        "tenure_years": 3,
        "deals_completed": 140,
        "base_price_multiplier": 1.03,
        "flexibility": 6.0,
        "warranty_offered": "Standard Brand Warranty Only",
        "stock_status": "LIMITED",
        "delivery_offered": False,
        "phone": "+91 99801 44521",
        "latitude": 15.4410,
        "longitude": 75.6420
    },
    {
        "_id": "seller-5",
        "name": "Sri Renuka Mobile Clinic & Store",
        "category": "Electronics",
        "location": "Hulkoti Market",
        "address": "Opposite Government Hospital, Hulkoti",
        "distance_km": 0.5,
        "rating": 4.9,
        "verification_status": "PREMIUM",
        "response_rate": 99,
        "tenure_years": 8,
        "deals_completed": 620,
        "base_price_multiplier": 1.10,
        "flexibility": 13.0,
        "warranty_offered": "1 Year Brand Warranty + Temper Glass",
        "stock_status": "IN_STOCK",
        "delivery_offered": True,
        "phone": "+91 94490 22199",
        "latitude": 15.4320,
        "longitude": 75.6310
    },
    {
        "_id": "seller-6",
        "name": "Gadag Mobile World & Accessories",
        "category": "Electronics",
        "location": "Panchayat Circle, Gadag",
        "address": "Opp. SBI Bank Branch, Gadag",
        "distance_km": 3.1,
        "rating": 4.6,
        "verification_status": "VERIFIED",
        "response_rate": 94,
        "tenure_years": 5,
        "deals_completed": 310,
        "base_price_multiplier": 1.06,
        "flexibility": 9.0,
        "warranty_offered": "1 Year Official Samsung Warranty",
        "stock_status": "IN_STOCK",
        "delivery_offered": True,
        "phone": "+91 98440 55120",
        "latitude": 15.4380,
        "longitude": 75.6370
    },
    {
        "_id": "seller-7",
        "name": "Mahantesh Smart Mobiles",
        "category": "Electronics",
        "location": "Hulkoti Bazar",
        "address": "Near Co-Operative Bank, Hulkoti",
        "distance_km": 1.1,
        "rating": 4.3,
        "verification_status": "VERIFIED",
        "response_rate": 89,
        "tenure_years": 3,
        "deals_completed": 150,
        "base_price_multiplier": 1.14,
        "flexibility": 15.0,
        "warranty_offered": "1 Year Brand Warranty",
        "stock_status": "LIMITED",
        "delivery_offered": False,
        "phone": "+91 97401 33100",
        "latitude": 15.4300,
        "longitude": 75.6300
    },
    {
        "_id": "seller-8",
        "name": "Honnur General Store & Kirana",
        "category": "Groceries",
        "location": "Hulkoti Main Bazar",
        "address": "Near Veereshwar Temple, Hulkoti",
        "distance_km": 0.4,
        "rating": 4.9,
        "verification_status": "PREMIUM",
        "response_rate": 98,
        "tenure_years": 14,
        "deals_completed": 1250,
        "base_price_multiplier": 1.07,
        "flexibility": 10.0,
        "warranty_offered": "FSSAI Certified Premium Quality",
        "stock_status": "IN_STOCK",
        "delivery_offered": True,
        "phone": "+91 94488 45910",
        "latitude": 15.4330,
        "longitude": 75.6320
    },
    {
        "_id": "seller-9",
        "name": "Sri Veerabhadreshwar Hardware & Tools",
        "category": "Hardware",
        "location": "Industrial Area, Gadag",
        "address": "Plot 12, APMC Industrial Layout, Gadag",
        "distance_km": 3.8,
        "rating": 4.7,
        "verification_status": "VERIFIED",
        "response_rate": 96,
        "tenure_years": 10,
        "deals_completed": 480,
        "base_price_multiplier": 1.04,
        "flexibility": 8.0,
        "warranty_offered": "6 Months Bosch Official Warranty",
        "stock_status": "IN_STOCK",
        "delivery_offered": True,
        "phone": "+91 98800 11980",
        "latitude": 15.4400,
        "longitude": 75.6400
    },
    {
        "_id": "seller-10",
        "name": "Kamat Textiles & Garments",
        "category": "Clothing",
        "location": "Cloth Bazar, Gadag",
        "address": "Shop #45, Municipal Complex, Gadag",
        "distance_km": 2.9,
        "rating": 4.5,
        "verification_status": "VERIFIED",
        "response_rate": 92,
        "tenure_years": 12,
        "deals_completed": 890,
        "base_price_multiplier": 1.09,
        "flexibility": 12.0,
        "warranty_offered": "Color Fastness Guaranteed",
        "stock_status": "IN_STOCK",
        "delivery_offered": True,
        "phone": "+91 94491 88200",
        "latitude": 15.4360,
        "longitude": 75.6360
    }
]

INITIAL_PRODUCTS = [
    {
        "_id": "prod-1",
        "name": "Coding Laptop (16GB RAM / 512GB SSD)",
        "category": "Computers",
        "brand": "Asus / Lenovo / HP",
        "market_price_range": "₹55,000 - ₹65,000"
    },
    {
        "_id": "prod-2",
        "name": "Samsung Galaxy Smartphone 5G",
        "category": "Electronics",
        "brand": "Samsung",
        "market_price_range": "₹17,000 - ₹20,000"
    },
    {
        "_id": "prod-3",
        "name": "5kg Sona Masoori Rice Bag",
        "category": "Groceries",
        "brand": "Premium Mill Harvest",
        "market_price_range": "₹370 - ₹450"
    },
    {
        "_id": "prod-4",
        "name": "Impact Drill Machine (500W)",
        "category": "Hardware",
        "brand": "Bosch Power Tools",
        "market_price_range": "₹2,200 - ₹2,800"
    }
]

def seed_database():
    print("[INIT] Connecting to MongoDB Atlas cluster...")
    status = get_database_status()
    print(f"Status: {status['status']} | Cluster: {status.get('cluster')}")

    if status["status"] != "CONNECTED":
        print(f"[ERROR] Connection failed: {status.get('error')}")
        return

    # Seed Expanded Sellers
    for s in EXPANDED_SELLERS:
        sellers_col.update_one({"_id": s["_id"]}, {"$set": s}, upsert=True)
    print(f"[OK] Seeded {len(EXPANDED_SELLERS)} local sellers into 'sellers' collection.")

    # Seed Products
    for p in INITIAL_PRODUCTS:
        products_col.update_one({"_id": p["_id"]}, {"$set": p}, upsert=True)
    print(f"[OK] Seeded {len(INITIAL_PRODUCTS)} products into 'products' collection.")

    new_status = get_database_status()
    print("\n[INFO] Updated Collection Counts on MongoDB Atlas:")
    for col_name, count in new_status["collections"].items():
        print(f"  - {col_name}: {count} documents")

if __name__ == "__main__":
    seed_database()
