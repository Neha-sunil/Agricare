from pydantic import BaseModel
from typing import List, Optional

class FarmProfileCreate(BaseModel):
    full_name: str
    phone: str
    location: str
    land_area: float
    terrain_type: str
    irrigation_system: str
    soil_type: str
    season: str
    water_availability: str
    preferred_language: str
    # Optional fields for AI engine
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    temperature: Optional[float] = 25.0
    humidity: Optional[float] = 60.0
    rainfall: Optional[float] = 800.0

class ProfileResponse(BaseModel):
    success: bool
    farm_profile_id: str

class RecommendationInput(BaseModel):
    farm_profile_id: str

class CropSelectionInput(BaseModel):
    farm_profile_id: str
    selected_crop: str

class AssistantQueryInput(BaseModel):
    farm_profile_id: Optional[str] = "guest_user"
    query_text: str
    lang: Optional[str] = "EN"

class AssistantResponse(BaseModel):
    detected_intent: str
    response: str
    spoken_summary: Optional[str] = None
    data: Optional[dict] = None
