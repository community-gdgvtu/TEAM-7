import os
from pymongo import MongoClient

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://panchayat_app:98fWymt0AGFHiVLqOqZImQ@cluster0.5rrxf0y.mongodb.net/panchayat_ai"
)

# Connect to MongoDB Atlas
client = MongoClient(MONGODB_URI)
db = client["panchayat_ai"]

# Collections
users_col = db["users"]
sellers_col = db["sellers"]
products_col = db["products"]
negotiation_sessions_col = db["negotiation_sessions"]
offers_col = db["offers"]
negotiation_events_col = db["negotiation_events"]
fact_bus_col = db["fact_bus"]

# Create Performance Indexes
try:
    users_col.create_index("email", unique=True)
    sellers_col.create_index([("category", 1), ("rating", -1), ("distance_km", 1)])
    negotiation_sessions_col.create_index([("created_at", -1)])
    fact_bus_col.create_index([("sessionId", 1), ("timestamp", 1)])
except Exception:
    pass # Atlas permissions fallback handled gracefully

def get_database_status() -> dict:
    """Returns database connection status and collection counts."""
    try:
        # Ping the cluster
        client.admin.command('ping')
        return {
            "status": "CONNECTED",
            "cluster": "Cluster0 (MongoDB Atlas)",
            "database": "panchayat_ai",
            "collections": {
                "users": users_col.count_documents({}),
                "sellers": sellers_col.count_documents({}),
                "products": products_col.count_documents({}),
                "negotiation_sessions": negotiation_sessions_col.count_documents({}),
                "offers": offers_col.count_documents({}),
                "negotiation_events": negotiation_events_col.count_documents({}),
                "fact_bus": fact_bus_col.count_documents({})
            }
        }
    except Exception as e:
        return {
            "status": "DISCONNECTED",
            "error": str(e)
        }
