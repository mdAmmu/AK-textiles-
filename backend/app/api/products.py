import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.core.supabase_client import upload_product_image
from app.models.product import Product
from app.models.user import User
from app.schemas.broadcast import BroadcastPreview, BroadcastRequest, BroadcastResult
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate
from app.services.broadcast_service import broadcast_product, get_broadcast_preview

router = APIRouter(prefix="/products", tags=["products"])

IMAGE_SLOTS = ["image_1", "image_2", "image_3", "image_4"]


@router.get("", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    products = db.query(Product).order_by(Product.created_at.desc()).all()
    return [_to_out(p) for p in products]


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)
):
    return _to_out(_get_product_or_404(db, product_id))


@router.post("", response_model=ProductOut)
def create_product(
    body: ProductCreate, db: Session = Depends(get_db), _admin: User = Depends(require_admin)
):
    product = Product(**body.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return _to_out(product)


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str,
    body: ProductUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    product = _get_product_or_404(db, product_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return _to_out(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)
):
    product = _get_product_or_404(db, product_id)
    db.delete(product)
    db.commit()


@router.post("/{product_id}/images", response_model=ProductOut)
async def upload_image(
    product_id: str,
    file: UploadFile,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    product = _get_product_or_404(db, product_id)

    slot = next((s for s in IMAGE_SLOTS if getattr(product, s) is None), None)
    if slot is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Product already has 4 images"
        )

    content = await file.read()
    extension = (file.filename or "").rsplit(".", 1)[-1] if "." in (file.filename or "") else "jpg"
    filename = f"{product_id}/{uuid.uuid4()}.{extension}"
    url = upload_product_image(filename, content, file.content_type or "image/jpeg")

    setattr(product, slot, url)
    db.commit()
    db.refresh(product)
    return _to_out(product)


@router.get("/{product_id}/broadcast/preview", response_model=BroadcastPreview)
def preview_broadcast(
    product_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)
):
    product = _get_product_or_404(db, product_id)
    return get_broadcast_preview(db, product)


@router.post("/{product_id}/broadcast", response_model=BroadcastResult)
async def send_broadcast(
    product_id: str,
    body: BroadcastRequest = BroadcastRequest(),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    product = _get_product_or_404(db, product_id)
    return await broadcast_product(db, product, admin, group_ids=body.group_ids)


def _get_product_or_404(db: Session, product_id: str) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


def _to_out(product: Product) -> ProductOut:
    return ProductOut(
        id=str(product.id),
        name=product.name,
        description=product.description,
        image_1=product.image_1,
        image_2=product.image_2,
        image_3=product.image_3,
        image_4=product.image_4,
        dubai_price=float(product.dubai_price) if product.dubai_price is not None else None,
        south_africa_price=(
            float(product.south_africa_price) if product.south_africa_price is not None else None
        ),
        india_price=float(product.india_price) if product.india_price is not None else None,
        local_price=float(product.local_price) if product.local_price is not None else None,
    )
