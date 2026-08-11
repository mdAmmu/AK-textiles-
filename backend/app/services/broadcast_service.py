from sqlalchemy.orm import Session

from app.models.group import Group
from app.models.product import Product
from app.models.user import User, UserRole
from app.schemas.broadcast import BroadcastGroupBreakdown, BroadcastPreview, BroadcastResult
from app.services.chat_service import send_group_product_message


def get_broadcast_preview(db: Session, product: Product) -> BroadcastPreview:
    groups = db.query(Group).order_by(Group.name).all()
    breakdown = [_group_breakdown(db, product, g) for g in groups]
    total_customers = sum(b.customer_count for b in breakdown)

    return BroadcastPreview(
        product_id=str(product.id),
        product_name=product.name,
        groups=breakdown,
        total_customers=total_customers,
    )


async def broadcast_product(
    db: Session, product: Product, admin: User, group_ids: list[str] | None = None
) -> BroadcastResult:
    query = db.query(Group).order_by(Group.name)
    if group_ids is not None:
        query = query.filter(Group.id.in_(group_ids))
    groups = query.all()
    breakdown = []
    total_sent = 0

    for group in groups:
        price = product.price_for_group(group.name)
        customer_count = (
            db.query(User)
            .filter(User.role == UserRole.USER, User.group_id == group.id)
            .count()
        )

        if customer_count > 0:
            await send_group_product_message(db, group, admin.id, product)

        total_sent += customer_count
        breakdown.append(
            BroadcastGroupBreakdown(
                group_id=str(group.id),
                group_name=group.name,
                customer_count=customer_count,
                price=price,
            )
        )

    return BroadcastResult(product_id=str(product.id), total_sent=total_sent, groups=breakdown)


def _group_breakdown(db: Session, product: Product, group: Group) -> BroadcastGroupBreakdown:
    customer_count = (
        db.query(User)
        .filter(User.role == UserRole.USER, User.group_id == group.id)
        .count()
    )
    return BroadcastGroupBreakdown(
        group_id=str(group.id),
        group_name=group.name,
        customer_count=customer_count,
        price=product.price_for_group(group.name),
    )
