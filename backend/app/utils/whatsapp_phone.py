import re
from typing import TYPE_CHECKING

from app.core.config import settings

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from app.models.user import User


def normalize_phone(raw_phone: str) -> str | None:
    """Normalizes a stored user phone into WhatsApp's expected format:
    digits only, with country code, no leading '+'.

    Returns None if the input has no digits at all.
    """
    digits = re.sub(r"\D", "", raw_phone or "")
    if not digits:
        return None

    if digits.startswith("00"):
        digits = digits[2:]

    # Already has a country code (heuristic: longer than a bare 10-digit
    # local number) -> use as-is. Otherwise prefix the default country code.
    if len(digits) <= 10:
        digits = f"{settings.whatsapp_default_country_code}{digits}"

    return digits


def find_user_by_wa_number(db: "Session", wa_number: str) -> "User | None":
    """Reverse lookup: which of our users does this inbound WhatsApp `from`
    number (already digits-with-country-code, as Meta sends it) belong to.

    There's no indexed normalized-phone column to query directly, so this
    scans registered users and normalizes each stored phone the same way
    outbound numbers are normalized. Fine at the customer counts this app
    deals with; revisit with a stored normalized-phone column + index if
    the user base grows large enough for this to matter.
    """
    from app.models.user import User, UserRole

    users = db.query(User).filter(User.role == UserRole.USER, User.phone.isnot(None)).all()
    for user in users:
        if normalize_phone(user.phone) == wa_number:
            return user
    return None
