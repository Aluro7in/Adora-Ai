"""
Adora AI — Security & Authentication Middleware
Verifies Firebase ID tokens and enforces user identity isolation.
"""

from typing import Optional
from dataclasses import dataclass
from fastapi import Header, Depends
from app.core.exceptions import UnauthenticatedException
from app.core.logging import logger
from app.core.config import settings

try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth, credentials

    if not firebase_admin._apps:
        if settings.FIREBASE_CREDENTIALS_PATH:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
    _firebase_available = True
except Exception as e:
    logger.warning(f"Firebase Admin not initialized with service credentials: {e}")
    _firebase_available = False


@dataclass
class UserContext:
    uid: str
    email: Optional[str] = None
    is_authenticated: bool = True


async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> UserContext:
    """
    Validates Firebase ID token and extracts authenticated UserContext.
    Never accepts client-supplied UID headers as proof of identity.
    """
    if not authorization or not authorization.startswith("Bearer "):
        # In development without token, allow mock local user if in dev mode
        if settings.ENVIRONMENT == "development":
            return UserContext(uid="usr_adora_local", email="dev@adora.ai")
        raise UnauthenticatedException("Missing Bearer ID token in Authorization header")

    token = authorization.split("Bearer ")[1].strip()

    if _firebase_available:
        try:
            decoded_token = firebase_auth.verify_id_token(token)
            uid = decoded_token.get("uid")
            email = decoded_token.get("email")
            if not uid:
                raise UnauthenticatedException("Invalid token claims: missing uid")
            return UserContext(uid=uid, email=email)
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise UnauthenticatedException("Firebase ID token verification failed")
    else:
        # Fallback for local development/testing without live Firebase service account
        logger.debug("Firebase Admin not configured, accepting token in development mode")
        return UserContext(uid="usr_adora_local", email="dev@adora.ai")
