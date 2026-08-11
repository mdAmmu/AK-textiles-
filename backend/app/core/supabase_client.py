from functools import lru_cache

from supabase import create_client, Client

from app.core.config import settings

PRODUCT_IMAGES_BUCKET = "product-images"


@lru_cache
def get_supabase() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_key)


def ensure_product_images_bucket() -> None:
    client = get_supabase()
    buckets = {b.name for b in client.storage.list_buckets()}
    if PRODUCT_IMAGES_BUCKET not in buckets:
        client.storage.create_bucket(PRODUCT_IMAGES_BUCKET, options={"public": True})


def upload_product_image(filename: str, content: bytes, content_type: str) -> str:
    ensure_product_images_bucket()
    client = get_supabase()
    client.storage.from_(PRODUCT_IMAGES_BUCKET).upload(
        filename, content, {"content-type": content_type, "upsert": "true"}
    )
    return client.storage.from_(PRODUCT_IMAGES_BUCKET).get_public_url(filename)
