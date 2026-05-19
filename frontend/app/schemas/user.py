# ==========================================
# app/schemas/user.py
# ==========================================

from pydantic import BaseModel, EmailStr


# REGISTER SCHEMA
class UserCreate(BaseModel):

    name: str

    email: EmailStr

    password: str


# LOGIN SCHEMA
class UserLogin(BaseModel):

    email: EmailStr

    password: str


# FORGOT PASSWORD
class ForgotPassword(BaseModel):

    email: EmailStr


# RESET PASSWORD
class ResetPassword(BaseModel):

    email: EmailStr

    new_password: str