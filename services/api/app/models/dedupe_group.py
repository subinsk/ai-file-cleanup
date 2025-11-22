from app.models.base import Base
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


class DedupeGroup(Base):
    __tablename__ = "dedupe_groups"

    id = Column("id", UUID(as_uuid=True), primary_key=True)
    uploadId = Column("upload_id", UUID(as_uuid=True), nullable=False)
    groupIndex = Column("group_index", Integer, nullable=False)
    keptFileId = Column("kept_file_id", UUID(as_uuid=True))

    # Relationships
    # upload relationship defined in Upload model
    # keptFile relationship defined in File model

