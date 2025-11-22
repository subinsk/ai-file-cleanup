"""SQLAlchemy models for database access"""
from sqlalchemy.orm import declarative_base

# Base class for all models
Base = declarative_base()

# Import all models (so they're registered with Base)
from app.models.user import User
from app.models.license_key import LicenseKey
from app.models.upload import Upload
from app.models.file import File
from app.models.file_embedding import FileEmbedding
from app.models.dedupe_group import DedupeGroup

__all__ = [
    'Base',
    'User',
    'LicenseKey',
    'Upload',
    'File',
    'FileEmbedding',
    'DedupeGroup',
]
