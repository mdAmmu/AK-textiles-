from pydantic import BaseModel


class BroadcastRequest(BaseModel):
    group_ids: list[str] | None = None


class BroadcastGroupBreakdown(BaseModel):
    group_id: str
    group_name: str
    customer_count: int
    price: float | None = None


class BroadcastPreview(BaseModel):
    product_id: str
    product_name: str
    groups: list[BroadcastGroupBreakdown]
    total_customers: int


class BroadcastResult(BaseModel):
    product_id: str
    total_sent: int
    groups: list[BroadcastGroupBreakdown]
