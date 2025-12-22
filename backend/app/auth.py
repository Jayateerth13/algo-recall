import os

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel


security = HTTPBearer(auto_error=True)


class CurrentUser(BaseModel):
    id: str
    email: str | None = None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    """
    Extract and validate the Supabase JWT from the Authorization header.

    The frontend (Supabase client) will send `Authorization: Bearer <access_token>`.
    We verify it using the SUPABASE_JWT_SECRET and return a simple CurrentUser model.
    """
    token = credentials.credentials
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication not configured on server",
        )

    try:
        # Supabase uses HS256 with its JWT secret
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return CurrentUser(id=user_id, email=email)



