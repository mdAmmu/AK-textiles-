import re

from app.core.config import settings


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
