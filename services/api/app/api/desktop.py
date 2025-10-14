"""Desktop app endpoints"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


class ValidateLicenseRequest(BaseModel):
    licenseKey: str


class ValidateLicenseResponse(BaseModel):
    valid: bool
    message: str


@router.post("/validate-license", response_model=ValidateLicenseResponse)
async def validate_license(request: ValidateLicenseRequest):
    """Validate a license key for desktop app"""
    db = get_db()
    
    try:
        # Find the license key
        license_key = await db.licensekey.find_first(
            where={"key": request.licenseKey}
        )
        
        if not license_key:
            return ValidateLicenseResponse(
                valid=False,
                message="License key not found"
            )
        
        if license_key.revoked:
            return ValidateLicenseResponse(
                valid=False,
                message="License key has been revoked"
            )
        
        logger.info(f"License key validated: {request.licenseKey}")
        
        return ValidateLicenseResponse(
            valid=True,
            message="License key is valid"
        )
        
    except Exception as e:
        logger.error(f"License validation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="License validation failed")
