"""One-off migration: re-encode existing WebP product images to JPEG.

WhatsApp's Cloud API rejects WebP for media messages (error 131053), but
product images were uploaded as WebP before that validation was added to
the upload endpoints. This script downloads each stored WebP image,
converts it to JPEG, re-uploads it, and updates the product record's URL.

Run from the backend/ directory with the project's venv:
    venv/Scripts/python.exe scripts/migrate_webp_images.py
"""

import httpx

from app.core.database import SessionLocal
from app.core.image_utils import normalize_image
from app.core.supabase_client import upload_product_image
from app.models.product import Product

IMAGE_SLOTS = ["image_1", "image_2", "image_3", "image_4"]


def main() -> None:
    db = SessionLocal()
    client = httpx.Client(timeout=30)
    converted = 0

    try:
        for product in db.query(Product).all():
            for slot in IMAGE_SLOTS:
                url = getattr(product, slot)
                if not url or not url.lower().endswith(".webp"):
                    continue

                response = client.get(url)
                if response.status_code != 200:
                    print(f"  SKIP {url} -> download failed ({response.status_code})")
                    continue

                content, content_type, extension = normalize_image(
                    response.content, "image/webp", "image.webp"
                )

                old_path = url.rsplit("/product-images/", 1)[-1]
                new_path = old_path.rsplit(".", 1)[0] + ".jpg"
                new_url = upload_product_image(new_path, content, content_type)

                setattr(product, slot, new_url)
                db.commit()
                converted += 1
                print(f"  OK {url}\n     -> {new_url}")

        print(f"\nConverted {converted} image(s).")
    finally:
        client.close()
        db.close()


if __name__ == "__main__":
    main()
