from pydantic import BaseModel, EmailStr, Field


# =========================================================
# REGISTER USER
# =========================================================

class RegisterUser(BaseModel):

    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=6
    )


# =========================================================
# LOGIN USER
# =========================================================

class LoginUser(BaseModel):

    email: EmailStr

    password: str


# =========================================================
# USER RESPONSE
# =========================================================

class UserResponse(BaseModel):

    id: str

    name: str

    email: str

    provider: str