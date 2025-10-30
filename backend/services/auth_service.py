"""
Authentication and JWT token handling.
"""

import jwt
import logging
from typing import Dict, Any
from fastapi import HTTPException
from backend.core import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class AuthService:
    """Service for JWT token verification and decoding."""

    @staticmethod
    def verify_and_decode_token(token: str) -> Dict[str, Any]:
        """
        Verify and decode JWT token from Supabase with signature verification.

        Args:
            token: JWT token string

        Returns:
            Decoded token claims

        Raises:
            HTTPException: If token is invalid or verification fails
        """
        try:
            # Verify signature using Supabase JWT secret (HS256 algorithm)
            # Supabase uses HS256 algorithm by default
            # Validate the audience claim - should be "authenticated"
            decoded = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience=settings.SUPABASE_JWT_AUDIENCE,
                options={"verify_aud": True}
            )
            return decoded

        except jwt.ExpiredSignatureError as e:
            logger.warning(f"[AUTH] ✗ Token expired: {str(e)}")
            raise HTTPException(status_code=401, detail="Token expired") from e
        except jwt.InvalidSignatureError as e:
            logger.warning(f"[AUTH] ✗ Invalid token signature: {str(e)}")
            logger.warning(f"[AUTH] Secret key length: {len(settings.SUPABASE_JWT_SECRET)}")
            raise HTTPException(status_code=401, detail="Invalid token signature") from e
        except jwt.DecodeError as e:
            logger.warning(f"[AUTH] ✗ Invalid token format: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid token format") from e
        except jwt.InvalidTokenError as e:
            logger.warning(f"[AUTH] ✗ Invalid token: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid token") from e
        except Exception as e:
            logger.error(f"[AUTH] ✗ Unexpected authentication error: {str(e)}")
            logger.error(f"[AUTH] Secret available: {bool(settings.SUPABASE_JWT_SECRET)}")
            raise HTTPException(status_code=401, detail="Authentication failed") from e

    @staticmethod
    def extract_user_info(token_claims: Dict[str, Any]) -> tuple:
        """
        Extract user information from token claims.

        Args:
            token_claims: Decoded JWT claims

        Returns:
            Tuple of (user_id, email)

        Raises:
            HTTPException: If required claims are missing
        """
        user_id = token_claims.get("sub")
        email = token_claims.get("email", "unknown@email.com")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")

        return user_id, email


# Singleton instance
auth_service = AuthService()
