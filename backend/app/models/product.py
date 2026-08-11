import uuid

from sqlalchemy import Column, String, Text, Numeric, DateTime, func
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    image_1 = Column(String(500), nullable=True)
    image_2 = Column(String(500), nullable=True)
    image_3 = Column(String(500), nullable=True)
    image_4 = Column(String(500), nullable=True)

    dubai_price = Column(Numeric(10, 2), nullable=True)
    south_africa_price = Column(Numeric(10, 2), nullable=True)
    india_price = Column(Numeric(10, 2), nullable=True)
    local_price = Column(Numeric(10, 2), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def price_for_group(self, group_name: str):
        mapping = {
            "dubai": self.dubai_price,
            "south_africa": self.south_africa_price,
            "india": self.india_price,
            "local": self.local_price,
        }
        return mapping.get(group_name.lower().replace(" ", "_"))
