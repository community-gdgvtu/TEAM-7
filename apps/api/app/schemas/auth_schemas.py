from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal

UserRole = Literal['CUSTOMER', 'SELLER', 'ADMIN']

class CustomerRegisterSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, description="Password must be at least 6 characters")
    name: str = Field(min_length=2)
    phone: Optional[str] = "+91 98000 00000"
    location: Optional[str] = "Hulkoti Market, Gadag"

class SellerRegisterSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)
    shop_name: str = Field(min_length=2)
    category: Literal['Electronics', 'Groceries', 'Clothing', 'Hardware', 'Computers']
    phone: str
    address: str
    location: Optional[str] = "Hulkoti Market, Gadag"

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class UserResponseSchema(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    phone: Optional[str] = None
    location: Optional[str] = None
    created_at: str

class TokenResponseSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponseSchema
