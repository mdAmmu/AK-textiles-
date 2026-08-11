import base64

import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient

from app.core.config import settings


def _frontend_api_from_publishable_key(key: str) -> str:
    # pk_test_<base64("domain$")> / pk_live_<base64("domain$")>
    encoded = key.split("_", 2)[-1]
    padded = encoded + "=" * (-len(encoded) % 4)
    domain = base64.b64decode(padded).decode().rstrip("$")
    return domain


def _jwks_url() -> str:
    if settings.clerk_jwks_url:
        return settings.clerk_jwks_url
    domain = _frontend_api_from_publishable_key(settings.clerk_publishable_key)
    return f"https://{domain}/.well-known/jwks.json"


_jwk_client = None


def _get_jwk_client() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        _jwk_client = PyJWKClient(_jwks_url())
    return _jwk_client


def verify_clerk_token(token: str) -> dict:
    try:
        signing_key = _get_jwk_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(token, signing_key.key, algorithms=["RS256"])
        return payload
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
        ) from exc
