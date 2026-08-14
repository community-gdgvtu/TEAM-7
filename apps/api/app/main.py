import os
import sys
import site
import time

# Ensure Windows user site-packages is on sys.path
user_site = site.getusersitepackages()
if user_site and user_site not in sys.path:
    sys.path.append(user_site)

# Ensure apps/api is on sys.path when executed directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.api.auth_routes import auth_router
from app.api.admin_routes import admin_router
from app.api.websockets import router as ws_router


from app.core.observability import (
    RequestObservabilityMiddleware,
    check_database_health,
    check_ai_engine_health,
    check_websocket_health
)

app = FastAPI(
    title="Panchayat AI API — Fact Bus Multi-Agent Service",
    description="AI-Powered Local Market Negotiation & Price-Discovery Backend Engine",
    version="1.0.0"
)

# Observability Middleware
app.add_middleware(RequestObservabilityMiddleware)

# CORS middleware for frontend monorepo access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5176", "http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(api_router, prefix="/api")
app.include_router(ws_router)

# Health Endpoints
@app.get("/health")
def health_overall():
    db_h = check_database_health()
    ai_h = check_ai_engine_health()
    ws_h = check_websocket_health()

    overall = "HEALTHY" if db_h["status"] == "HEALTHY" and ai_h["status"] == "HEALTHY" else "DEGRADED"

    return {
        "status": overall,
        "service": "Panchayat AI API Engine",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "components": {
            "database": db_h,
            "ai_engine": ai_h,
            "websocket": ws_h
        }
    }

@app.get("/health/database")
def health_database():
    return check_database_health()

@app.get("/health/ai")
def health_ai():
    return check_ai_engine_health()

@app.get("/health/websocket")
def health_websocket():
    return check_websocket_health()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Panchayat AI Fact Bus Engine",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
