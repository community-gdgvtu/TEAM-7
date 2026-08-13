import os
import hashlib
import hmac
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

# Security Config
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "panchayat_ai_super_secret_jwt_key_2026_secure_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 Hours


def hash_password(password: str) -> str:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with a random salt.
    Format: salt_hex$hash_hex
    """
    salt = os.urandom(16).hex()
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100_000
    ).hex()
    return f"{salt}${pwd_hash}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a stored salt$hash string.
    """
    try:
        salt, stored_hash = hashed_password.split('$')
        computed_hash = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            100_000
        ).hex()
        return hmac.compare_digest(stored_hash, computed_hash)
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a signed JWT access token.

    Automatically embeds the canonical permission list derived from the role.
    This is for CLIENT UX ONLY — the server always re-derives permissions
    from the 'role' claim via the RBAC engine and never trusts 'permissions'.
    """
    from app.core.rbac import rbac_engine  # Deferred to avoid circular import

    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    role = data.get("role", "CUSTOMER")

    to_encode.update({
        "exp": expire,
        "iat": now,
        # Embed permissions for frontend UX (hide/show UI elements).
        # SERVER MUST NOT trust this — always re-derive via rbac_engine.get_permissions().
        "permissions": rbac_engine.get_permissions_as_strings(role),
    })

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a JWT access token. Returns payload or None if invalid/expired.
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None
