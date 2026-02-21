from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings


ACCESS_LIFETIME_MINUTES = 30
REFRESH_LIFETIME_DAYS = 7


def _encode(payload):
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def create_token_pair(user):
    now = datetime.now(timezone.utc)
    access_payload = {
        "sub": str(user.id),
        "type": "access",
        "exp": now + timedelta(minutes=ACCESS_LIFETIME_MINUTES),
    }
    refresh_payload = {
        "sub": str(user.id),
        "type": "refresh",
        "exp": now + timedelta(days=REFRESH_LIFETIME_DAYS),
    }
    return {"access": _encode(access_payload), "refresh": _encode(refresh_payload)}


def decode_refresh_token(token):
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("Invalid refresh token")
    return payload
