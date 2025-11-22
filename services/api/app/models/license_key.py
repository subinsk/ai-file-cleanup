"""LicenseKey model"""
from sqlalchemy import Column, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.models import Base


class LicenseKey(Base):
    __tablename__ = "license_keys"

    key = Column("key", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column("created_at", DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    revoked = Column("revoked", Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="license_keys")

    # Indexes
    __table_args__ = (
        Index('license_keys_user_id_idx', 'user_id'),
        Index('license_keys_revoked_created_at_idx', 'revoked', 'created_at'),
    )
