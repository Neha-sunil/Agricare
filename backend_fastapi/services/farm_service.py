from datetime import datetime
from bson import ObjectId
from db.mongo import get_database

class FarmService:
    @staticmethod
    async def create_profile(profile_data: dict):
        db = get_database()
        profile_data["created_at"] = datetime.now()
        result = await db.farm_profiles.insert_one(profile_data)
        return str(result.inserted_id)

    @staticmethod
    async def get_profile(profile_id: str):
        db = get_database()
        return await db.farm_profiles.find_one({"_id": ObjectId(profile_id)})

farm_service = FarmService()
