from pydantic import BaseModel, field_validator

# The OTP lives here so the schema and service agree on the same value
# without either importing the other.
MOCK_OTP = "123456"


class RegisterRequest(BaseModel):
    username: str
    password: str
    otp: str
    display_name: str
    avatar_url: str | None = None

    @field_validator("username")
    @classmethod
    def normalise_username(cls, v: str) -> str:
        v = v.strip().lower()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if not all(c.isalnum() or c in ("_", ".") for c in v):
            raise ValueError("Only letters, numbers, underscores and dots allowed")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("display_name")
    @classmethod
    def display_name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Display name cannot be empty")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
