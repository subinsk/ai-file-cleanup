from app.models.base import Base
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


class File(Base):
    __tablename__ = "files"


    # Relationships
    # id relationship defined in String model
    # uploadId relationship defined in String model
    # fileName relationship defined in String model
    # mimeType relationship defined in String model
    # sizeBytes relationship defined in BigInt model
    # sha256 relationship defined in String model
    # phash relationship defined in String model
    # textExcerpt relationship defined in String model
    # createdAt relationship defined in DateTime model
    # upload relationship defined in Upload model
    # embedding relationship defined in FileEmbedding model
    keptInGroup = relationship("DedupeGroup", back_populates="dedupeGroup")

