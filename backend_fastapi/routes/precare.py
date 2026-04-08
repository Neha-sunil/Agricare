from fastapi import APIRouter, HTTPException
from typing import List
from schemas.farm import FarmProfileCreate, ProfileResponse, RecommendationInput, CropSelectionInput
from services.farm_service import farm_service
from services.recommendation_service import recommendation_service
from services.plan_service import plan_service

router = APIRouter()

@router.post("/profile", response_model=ProfileResponse)
async def create_profile(profile: FarmProfileCreate):
    try:
        profile_id = await farm_service.create_profile(profile.dict())
        print(f"✅ New Farmer Registered in MongoDB with ID: {profile_id}")
        return {"success": True, "farm_profile_id": profile_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error during registration: {str(e)}")

@router.get("/profiles", response_model=List[dict])
async def list_profiles():
    # Returns all profiles for easy verification
    from db.mongo import get_database
    db = get_database()
    cursor = db.farm_profiles.find({})
    profiles = []
    async for p in cursor:
        p["_id"] = str(p["_id"])
        profiles.append(p)
    return profiles

@router.get("/profile/{profile_id}", response_model=dict)
async def get_single_profile(profile_id: str):
    # Returns details for a single farmer using their MongoDB ID
    profile = await farm_service.get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
    profile["_id"] = str(profile["_id"])
    return profile

@router.post("/recommend", response_model=dict)
async def get_recommendations(rec_input: RecommendationInput):
    # 1. Fetch profile from MongoDB
    profile = await farm_service.get_profile(rec_input.farm_profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Farm profile not found")
        
    # 2. Generate recommendations logic
    recommendations = recommendation_service.calculate_crops(profile)
    
    # 3. Store in crop_recommendations collection
    await recommendation_service.save_recommendations(rec_input.farm_profile_id, recommendations)
    
    return {"recommendations": recommendations}

@router.post("/validate-crop", response_model=dict)
async def validate_crop(selection: CropSelectionInput):
    profile = await farm_service.get_profile(selection.farm_profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Farm profile not found")
        
    validation_result = recommendation_service.validate_crop(profile, selection.selected_crop)
    return {"success": True, "validationResult": validation_result}

@router.post("/select-crop", response_model=dict)
async def select_crop(selection: CropSelectionInput):
    try:
        await recommendation_service.update_selected_crop(selection.farm_profile_id, selection.selected_crop)
        return {"success": True, "selected_crop": selection.selected_crop}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error during crop selection: {str(e)}")

@router.post("/generate-plan", response_model=dict)
async def generate_plan(selection: CropSelectionInput):
    try:
        profile = await farm_service.get_profile(selection.farm_profile_id)
        if not profile: profile = {}
        plan = plan_service.generate_precare_plan(selection.selected_crop, profile)
        return {"success": True, "plan": plan}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating plan: {str(e)}")

@router.post("/generate-tasks", response_model=dict)
async def generate_tasks(selection: CropSelectionInput):
    try:
        profile = await farm_service.get_profile(selection.farm_profile_id)
        if not profile: profile = {}
        plan = plan_service.generate_precare_plan(selection.selected_crop, profile)
        tasks = plan_service.generate_weekly_tasks(selection.selected_crop, plan)
        return {"success": True, "tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating tasks: {str(e)}")
@router.get("/history/{profile_id}", response_model=dict)
async def get_farming_history(profile_id: str):
    try:
        profile = await farm_service.get_profile(profile_id)
        if not profile: return {"success": False, "message": "Profile not found"}
        
        rec = await recommendation_service.get_recommendations_for_farm(profile_id)
        selected_crop = rec.get("selected_crop") if rec else None
        
        plan = None
        tasks = []
        if selected_crop:
            profile_data = {
                "location": profile.get("location"),
                "soil_type": profile.get("soil_type"),
                "land_area": profile.get("land_area"),
                "irrigation_system": profile.get("irrigation_system")
            }
            plan = plan_service.generate_precare_plan(selected_crop, profile_data)
            tasks = plan_service.generate_weekly_tasks(selected_crop, plan)
            
        return {
            "success": True,
            "profile": {
                "full_name": profile.get("full_name"),
                "location": profile.get("location"),
                "land_area": profile.get("land_area"),
                "soil_type": profile.get("soil_type"),
                "irrigation_system": profile.get("irrigation_system")
            },
            "selected_crop": selected_crop,
            "plan": plan,
            "tasks": tasks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
