from app.models.base import Base
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


class User(Base):
    __tablename__ = "users"


    # Relationships
    # id relationship defined in String model
    # email relationship defined in String model
    # name relationship defined in String model
    # passwordHash relationship defined in String model
    # createdAt relationship defined in DateTime model
    # updatedAt relationship defined in DateTime model
    licenseKeys = relationship("LicenseKey", back_populates="licenseKey")
    uploads = relationship("Upload", back_populates="upload")

