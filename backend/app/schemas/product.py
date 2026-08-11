from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    dubai_price: float | None = None
    south_africa_price: float | None = None
    india_price: float | None = None
    local_price: float | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    dubai_price: float | None = None
    south_africa_price: float | None = None
    india_price: float | None = None
    local_price: float | None = None


class ProductOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    image_1: str | None = None
    image_2: str | None = None
    image_3: str | None = None
    image_4: str | None = None
    dubai_price: float | None = None
    south_africa_price: float | None = None
    india_price: float | None = None
    local_price: float | None = None
