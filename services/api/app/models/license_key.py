from app.models.base import Base
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


class LicenseKey(Base):
    __tablename__ = "license_keys"

    key = Column("key", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    userId = Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column("created_at", DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    revoked = Column("revoked", Boolean, nullable=False, default=False)

    # Relationships
    user = relationship("User", back_populates="licenseKeys", uselist=False)

