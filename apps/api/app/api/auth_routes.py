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
from app.core.rbac import rbac_engine, UserRole

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


def _build_user_response(user_doc: dict) -> UserResponseSchema:
    """
    Builds a UserResponseSchema from a MongoDB user document.
    Re-derives permissions from role (never trusts stored permissions).
    """
    role = user_doc.get("role", UserRole.CUSTOMER.value)
    return UserResponseSchema(
        id=user_doc.get("_id", user_doc.get("id", "")),
        email=user_doc["email"],
        name=user_doc.get("name", "User"),
        role=role,
        phone=user_doc.get("phone"),
        location=user_doc.get("location"),
        created_at=user_doc.get("created_at", time.strftime("%Y-%m-%d %H:%M:%S")),
        permissions=rbac_engine.get_permissions_as_strings(role),
    )


def _role_level(role: str) -> int:
    levels = {
        UserRole.CUSTOMER.value:    1,
        UserRole.SELLER.value:      2,
        UserRole.ADMIN.value:       3,
        UserRole.SUPER_ADMIN.value: 4,
    }
    return levels.get(role, 1)


@auth_router.post("/register/customer", response_model=TokenResponseSchema, status_code=status.HTTP_201_CREATED)
def register_customer(payload: CustomerRegisterSchema):
    """Registers a new customer account with CUSTOMER role and negotiation permissions."""
    email_clean = payload.email.lower().strip()

    if users_col.find_one({"email": email_clean}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    user_id = f"usr-{int(time.time())}-{random.randint(100, 999)}"
    now_str = time.strftime("%Y-%m-%d %H:%M:%S")
    role = UserRole.CUSTOMER.value

    user_doc = {
        "_id": user_id,
        "email": email_clean,
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "role": role,
        "phone": payload.phone,
        "location": payload.location,
        "created_at": now_str,
        "owner_id": user_id,  # Self-ownership for profile operations
    }
    users_col.insert_one(user_doc)

    token = create_access_token({"sub": user_id, "email": email_clean, "role": role})
    user_resp = _build_user_response(user_doc)

    return TokenResponseSchema(
        access_token=token,
        token_type="bearer",
        user=user_resp,
        role_level=_role_level(role)
    )


@auth_router.post("/register/seller", response_model=TokenResponseSchema, status_code=status.HTTP_201_CREATED)
def register_seller(payload: SellerRegisterSchema):
    """Registers a new merchant account with SELLER role and business permissions."""
    email_clean = payload.email.lower().strip()

    if users_col.find_one({"email": email_clean}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    user_id = f"usr-seller-{int(time.time())}-{random.randint(100, 999)}"
    seller_id = f"seller-custom-{random.randint(1000, 9999)}"
    now_str = time.strftime("%Y-%m-%d %H:%M:%S")
    role = UserRole.SELLER.value

    # 1. Create User Document
    user_doc = {
        "_id": user_id,
        "email": email_clean,
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "role": role,
        "phone": payload.phone,
        "location": payload.location,
        "seller_id": seller_id,
        "created_at": now_str,
        "owner_id": user_id,
    }
    users_col.insert_one(user_doc)

    # 2. Create Seller Store Document — owner_id links seller profile to this user
    seller_doc = {
        "_id": seller_id,
        "owner_id": user_id,          # OWNERSHIP: this user owns this seller profile
        "owner_user_id": user_id,
        "name": payload.shop_name,
        "category": payload.category,
        "location": payload.location or "Hulkoti Market, Gadag",
        "address": payload.address,
        "distance_km": 1.2,
        "rating": 4.8,
        "verification_status": "PENDING",  # Requires ADMIN seller:verify
        "response_rate": 96,
        "tenure_years": 1,
        "deals_completed": 1,
        "base_price_multiplier": 1.05,
        "flexibility": 10.0,
        "warranty_offered": "1 Year Merchant Warranty",
        "stock_status": "IN_STOCK",
        "delivery_offered": True,
        "phone": payload.phone,
    }
    sellers_col.insert_one(seller_doc)

    token = create_access_token({
        "sub": user_id,
        "email": email_clean,
        "role": role,
        "seller_id": seller_id,
    })
    user_resp = _build_user_response(user_doc)

    return TokenResponseSchema(
        access_token=token,
        token_type="bearer",
        user=user_resp,
        role_level=_role_level(role)
    )


@auth_router.post("/login", response_model=TokenResponseSchema)
def login(payload: LoginSchema):
    """Authenticates credentials and issues JWT with role-derived permissions."""
    email_clean = payload.email.lower().strip()
    user = users_col.find_one({"email": email_clean})

    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = user["_id"]
    role = user.get("role", UserRole.CUSTOMER.value)

    token_data: dict = {"sub": user_id, "email": email_clean, "role": role}
    if "seller_id" in user:
        token_data["seller_id"] = user["seller_id"]

    token = create_access_token(token_data)
    user_resp = _build_user_response(user)

    return TokenResponseSchema(
        access_token=token,
        token_type="bearer",
        user=user_resp,
        role_level=_role_level(role)
    )


@auth_router.get("/me", response_model=UserResponseSchema)
def get_me(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated user's profile with current permission set."""
    return _build_user_response(current_user)


@auth_router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """Logs out user and invalidates client session."""
    return {"message": "Successfully logged out session", "user_id": current_user["id"]}
