from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from services.post_harvest_service import post_harvest_service
from typing import Optional

router = APIRouter()

# --- Field Validation Endpoint ---

@router.post("/validate-field")
async def validate_field(file: UploadFile = File(...), crop: str = Form(None)):
    """Validate if uploaded image is from an agricultural field."""
    image_bytes = await file.read()
    res = await post_harvest_service.validate_agricultural_field(image_bytes, crop)
    return res

# --- Image Based Endpoints ---

@router.post("/check-readiness")
async def check_readiness(crop: str = Form(...), file: UploadFile = File(...)):
    image_bytes = await file.read()
    res = await post_harvest_service.check_readiness(image_bytes, crop)
    return res

@router.post("/grade-quality")
async def grade_quality(crop: str = Form(...), file: UploadFile = File(...)):
    image_bytes = await file.read()
    res = await post_harvest_service.grade_quality(image_bytes, crop)
    return res

@router.post("/detect-damage")
async def detect_damage(crop: str = Form(...), file: UploadFile = File(...)):
    image_bytes = await file.read()
    res = await post_harvest_service.detect_damage(image_bytes, crop)
    return res

@router.post("/detect-spoilage")
async def detect_spoilage(crop: str = Form(...), file: UploadFile = File(...)):
    image_bytes = await file.read()
    res = await post_harvest_service.detect_spoilage(image_bytes, crop)
    return res

@router.post("/detect-phase")
async def detect_phase(crop: str = Form(...), file: UploadFile = File(...)):
    image_bytes = await file.read()
    res = await post_harvest_service.detect_current_phase(image_bytes, crop)
    return res

# --- Text/Recommendation Based Endpoints ---

@router.get("/harvesting-guidance")
async def harvesting_guidance(crop: str):
    return await post_harvest_service.get_harvesting_guidance(crop)

@router.get("/cleaning-sorting")
async def cleaning_sorting(crop: str):
    return await post_harvest_service.get_cleaning_sorting_guidance(crop)

@router.get("/drying-curing")
async def drying_curing(crop: str):
    return await post_harvest_service.get_drying_curing_guidance(crop)

@router.get("/storage-specs")
async def storage_specs(crop: str):
    return await post_harvest_service.get_storage_recommendation(crop)

@router.get("/packaging-guidance")
async def packaging_guidance(crop: str):
    return await post_harvest_service.get_packaging_guidance(crop)

@router.get("/transport-guidance")
async def transport_guidance(crop: str):
    return await post_harvest_service.get_transport_guidance(crop)

@router.get("/shelf-life")
async def shelf_life(crop: str, condition: str = "ambient"):
    return await post_harvest_service.predict_shelf_life(crop, condition)

@router.get("/market-decision")
async def market_decision(crop: str, grade: str = "Grade A"):
    return await post_harvest_service.get_market_decision(crop, grade)
