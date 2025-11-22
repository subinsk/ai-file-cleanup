"""User model"""
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.models import Base


class User(Base):
    __tablename__ = "users"

    id = Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column("email", String, unique=True, nullable=False)
    name = Column("name", String, nullable=True)
    password_hash = Column("password_hash", String, nullable=False)
    created_at = Column("created_at", DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column("updated_at", DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    license_keys = relationship("LicenseKey", back_populates="user", cascade="all, delete-orphan")
    uploads = relationship("Upload", back_populates="user", cascade="all, delete-orphan")
