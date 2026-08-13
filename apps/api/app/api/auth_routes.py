import time
import random
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth_schemas import (
    CustomerRegisterSchema,
    SellerRegisterSchema,
    LoginSchema,
    UserResponseSchema,
    TokenResponseSchema
)
from app.core.security import hash_password, verify_password, create_access_token
from app.core.database import users_col, sellers_col
from app.core.dependencies import get_current_user

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

@auth_router.post("/register/customer", response_model=TokenResponseSchema, status_code=status.HTTP_201_CREATED)
def register_customer(payload: CustomerRegisterSchema):
    """Registers a new customer account."""
    email_clean = payload.email.lower().strip()
    
    # Check if user already exists
    if users_col.find_one({"email": email_clean}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    user_id = f"usr-{int(time.time())}-{random.randint(100, 999)}"
    now_str = time.strftime("%Y-%m-%d %H:%M:%S")

    user_doc = {
        "_id": user_id,
        "email": email_clean,
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "role": "CUSTOMER",
        "phone": payload.phone,
        "location": payload.location,
        "created_at": now_str
    }

    users_col.insert_one(user_doc)

    # Issue JWT Token
    token = create_access_token({"sub": user_id, "email": email_clean, "role": "CUSTOMER"})

    user_resp = UserResponseSchema(
        id=user_id,
        email=email_clean,
        name=payload.name,
        role="CUSTOMER",
        phone=payload.phone,
        location=payload.location,
        created_at=now_str
    )

    return TokenResponseSchema(access_token=token, token_type="bearer", user=user_resp)

@auth_router.post("/register/seller", response_model=TokenResponseSchema, status_code=status.HTTP_201_CREATED)
def register_seller(payload: SellerRegisterSchema):
    """Registers a new merchant account and creates seller profile in MongoDB Atlas."""
    email_clean = payload.email.lower().strip()
    
    if users_col.find_one({"email": email_clean}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    user_id = f"usr-seller-{int(time.time())}-{random.randint(100, 999)}"
    seller_id = f"seller-custom-{random.randint(100, 999)}"
    now_str = time.strftime("%Y-%m-%d %H:%M:%S")

    # 1. Create User Document
    user_doc = {
        "_id": user_id,
        "email": email_clean,
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "role": "SELLER",
        "phone": payload.phone,
        "location": payload.location,
        "seller_id": seller_id,
        "created_at": now_str
    }
    users_col.insert_one(user_doc)

    # 2. Create Seller Store Document in MongoDB Atlas 'sellers' collection
    seller_doc = {
        "_id": seller_id,
        "name": payload.shop_name,
        "category": payload.category,
        "location": payload.location or "Hulkoti Market, Gadag",
        "address": payload.address,
        "distance_km": 1.2,
        "rating": 4.8,
        "verification_status": "VERIFIED",
        "response_rate": 96,
        "tenure_years": 1,
        "deals_completed": 1,
        "base_price_multiplier": 1.05,
        "flexibility": 10.0,
        "warranty_offered": "1 Year Merchant Warranty",
        "stock_status": "IN_STOCK",
        "delivery_offered": True,
        "phone": payload.phone
    }
    sellers_col.insert_one(seller_doc)

    # 3. Issue JWT Token
    token = create_access_token({"sub": user_id, "email": email_clean, "role": "SELLER", "seller_id": seller_id})

    user_resp = UserResponseSchema(
        id=user_id,
        email=email_clean,
        name=payload.name,
        role="SELLER",
        phone=payload.phone,
        location=payload.location,
        created_at=now_str
    )

    return TokenResponseSchema(access_token=token, token_type="bearer", user=user_resp)

@auth_router.post("/login", response_model=TokenResponseSchema)
def login(payload: LoginSchema):
    """Authenticates credentials and issues JWT access token."""
    email_clean = payload.email.lower().strip()
    user = users_col.find_one({"email": email_clean})

    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = user["_id"]
    role = user.get("role", "CUSTOMER")
    
    token = create_access_token({"sub": user_id, "email": email_clean, "role": role})

    user_resp = UserResponseSchema(
        id=user_id,
        email=user["email"],
        name=user.get("name", "User"),
        role=role,
        phone=user.get("phone"),
        location=user.get("location"),
        created_at=user.get("created_at", time.strftime("%Y-%m-%d %H:%M:%S"))
    )

    return TokenResponseSchema(access_token=token, token_type="bearer", user=user_resp)

@auth_router.get("/me", response_model=UserResponseSchema)
def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return UserResponseSchema(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user.get("name", "User"),
        role=current_user.get("role", "CUSTOMER"),
        phone=current_user.get("phone"),
        location=current_user.get("location"),
        created_at=current_user.get("created_at", "")
    )

@auth_router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """Logs out user and invalidates client session."""
    return {"message": "Successfully logged out session", "user_id": current_user["id"]}
