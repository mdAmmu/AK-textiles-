from functools import lru_cache

import boto3

from app.core.config import settings

PRODUCT_IMAGES_PREFIX = "product-images"
CHAT_IMAGES_PREFIX = "chat-images"
CHAT_FILES_PREFIX = "chat-files"


@lru_cache
def get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
    )


def _public_url(key: str) -> str:
    if settings.cloudfront_domain:
        return f"https://{settings.cloudfront_domain}/{key}"
    return f"https://{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{key}"


def _upload(prefix: str, filename: str, content: bytes, content_type: str) -> str:
    key = f"{prefix}/{filename}"
    get_s3_client().put_object(
        Bucket=settings.s3_bucket_name,
        Key=key,
        Body=content,
        ContentType=content_type,
    )
    return _public_url(key)


def upload_product_image(filename: str, content: bytes, content_type: str) -> str:
    return _upload(PRODUCT_IMAGES_PREFIX, filename, content, content_type)


def upload_chat_image(filename: str, content: bytes, content_type: str) -> str:
    return _upload(CHAT_IMAGES_PREFIX, filename, content, content_type)


def upload_chat_file(filename: str, content: bytes, content_type: str) -> str:
    return _upload(CHAT_FILES_PREFIX, filename, content, content_type)
