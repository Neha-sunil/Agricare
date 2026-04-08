from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import List, Optional, Any, Annotated
from datetime import datetime
from bson import ObjectId

# Helper to validate and convert ObjectId
def validate_object_id(v: Any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if not ObjectId.is_valid(str(v)):
        raise ValueError("Invalid ObjectId")
    return str(v)

# Custom type for Pydantic V2
PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]

class FarmProfileModel(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
    )
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    land_area: float
    location: str
    latitude: float
    longitude: float
    terrain_type: str
    irrigation_system: str
    soil_type: str
    season: str
    water_availability: str
    preferred_language: str
    temperature: float
    humidity: float
    rainfall: float
    created_at: datetime = Field(default_factory=datetime.now)

class RecommendedCrop(BaseModel):
    crop_name: str
    reason: str
    water_need: str
    care_level: str
    time_to_harvest: str

class CropRecommendationModel(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
    )
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    farm_profile_id: str
    recommended_crops: List[RecommendedCrop]
    selected_crop: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

class PreCarePlanModel(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
    )
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    farm_profile_id: str
    selected_crop: str
    soil_preparation: List[str]
    seed_preparation: List[str]
    fertilizer_plan: List[str]
    irrigation_plan: List[str]
    pest_prevention_plan: List[str]
    growth_monitoring_plan: List[str]
    created_at: datetime = Field(default_factory=datetime.now)

class FarmTaskModel(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
    )
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    farm_profile_id: str
    selected_crop: str
    title: str
    description: str
    category: str
    week_number: int
    is_completed: bool = False
    created_at: datetime = Field(default_factory=datetime.now)

class AssistantSessionModel(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
    )
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    farm_profile_id: str
    selected_crop: str
    current_stage: str
    current_week: int
    context_data: dict
    last_question: Optional[str] = None
    last_response: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.now)

class VoiceQueryLogModel(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
    )
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    farm_profile_id: str
    query_text: str
    detected_intent: str
    response: str
    created_at: datetime = Field(default_factory=datetime.now)
