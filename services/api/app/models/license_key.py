from app.models import Base
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


class LicenseKey(Base):
    __tablename__ = "license_keys"


    # Relationships
    # key relationship defined in String model
    # userId relationship defined in String model
    # createdAt relationship defined in DateTime model
    # revoked relationship defined in Boolean model
    # user relationship defined in User model

