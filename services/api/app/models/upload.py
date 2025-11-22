from app.models import Base
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


class Upload(Base):
    __tablename__ = "uploads"


    # Relationships
    # id relationship defined in String model
    # userId relationship defined in String model
    # totalFiles relationship defined in Int model
    # createdAt relationship defined in DateTime model
    # user relationship defined in User model
    files = relationship("File", back_populates="file")
    dedupeGroups = relationship("DedupeGroup", back_populates="dedupeGroup")

