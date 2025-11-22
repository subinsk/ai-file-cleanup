from app.models import Base
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


class DedupeGroup(Base):
    __tablename__ = "dedupe_groups"


    # Relationships
    # id relationship defined in String model
    # uploadId relationship defined in String model
    # groupIndex relationship defined in Int model
    # keptFileId relationship defined in String model
    # upload relationship defined in Upload model
    # keptFile relationship defined in File model

