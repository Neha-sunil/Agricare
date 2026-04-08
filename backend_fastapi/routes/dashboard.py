from fastapi import APIRouter, HTTPException
from bson import ObjectId
from typing import Dict, Any

from database.mongodb import get_database

router = APIRouter()

@router.get("/{farm_profile_id}", response_model=dict)
async def get_dashboard(farm_profile_id: str):
    db = get_database()
    
    # 1. Fetch farm profile
    profile = await db.farm_profiles.find_one({"_id": ObjectId(farm_profile_id)})
    if not profile:
        raise HTTPException(status_code=404, detail="Farm profile not found")
        
    # 2. Fetch recommendations
    rec = await db.crop_recommendations.find_one({"farm_profile_id": farm_profile_id})
    selected_crop = rec.get("selected_crop") if rec else None
    
    # 3. Fetch plan
    plan = await db.pre_care_plans.find_one({"farm_profile_id": farm_profile_id, "selected_crop": selected_crop})
    
    # 4. Fetch tasks
    cursor = db.farm_tasks.find({"farm_profile_id": farm_profile_id, "selected_crop": selected_crop})
    tasks = []
    async for task in cursor:
        task["_id"] = str(task["_id"])
        tasks.append(task)
        
    # Calculate progress
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.get("is_completed", False))
    progress = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    return {
        "farm_data": {**profile, "_id": str(profile["_id"])},
        "recommended_crops": rec.get("recommended_crops", []) if rec else [],
        "selected_crop": selected_crop,
        "plan": plan if plan else {},
        "tasks": tasks,
        "progress": round(progress, 2)
    }
