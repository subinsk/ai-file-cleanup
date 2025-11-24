from app.models.base import Base
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


class User(Base):
    __tablename__ = "users"

    id = Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column("email", String, unique=True, nullable=False)
    name = Column("name", String)
    passwordHash = Column("password_hash", String, nullable=False)
    createdAt = Column("created_at", DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updatedAt = Column("updated_at", DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    licenseKeys = relationship("LicenseKey", back_populates="user")
    uploads = relationship("Upload", back_populates="user")

