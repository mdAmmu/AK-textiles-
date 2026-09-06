"""One-off CLI to reset a user's password by phone number.

Usage:
    python scripts/reset_password.py <phone> <new_password>

Example:
    python scripts/reset_password.py 8857950160 MyNewPass123
"""
import sys

sys.path.insert(0, __file__.rsplit("scripts", 1)[0])

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def main() -> None:
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)

    phone, new_password = sys.argv[1], sys.argv[2]

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.phone == phone).first()
        if user is None:
            print(f"No user found with phone {phone}")
            sys.exit(1)

        user.password_hash = hash_password(new_password)
        db.commit()
        print(f"Password reset for {user.name} ({user.phone}).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
