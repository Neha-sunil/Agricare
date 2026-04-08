import os
import json
import google.generativeai as genai
from typing import List, Dict
from datetime import datetime
from bson import ObjectId
from db.mongo import get_database

class RecommendationService:
    @staticmethod
    def calculate_crops(farm_profile: dict) -> List[dict]:
        """AI or rule-based engine for crop recommendation."""
        # Try Gemini AI first if API key is present
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        if gemini_api_key:
            try:
                genai.configure(api_key=gemini_api_key)
                model = genai.GenerativeModel("gemini-1.5-pro-latest")
                
                prompt = f"""
                You are an expert agronomist AI. Provide crop recommendations based on the following farm profile:
                {json.dumps(farm_profile)}
                
                Analyze the data (like rainfall, temperature, soil type, location, etc.) and recommend 2 to 3 of the BEST crops to grow.
                
                Return the response strictly as a pure JSON array with no markdown formatting or additional text. Follow this structure:
                [
                    {{
                        "crop_name": "Name of the crop",
                        "reason": "Why it's a good fit based on the farm data",
                        "water_need": "Low / Moderate / High / Very High",
                        "care_level": "Minimal / Low / Moderate / High",
                        "time_to_harvest": "Estimated time (e.g., 3 months)"
                    }}
                ]
                """
                response = model.generate_content(prompt)
                response_text = response.text.replace("```json", "").replace("```", "").strip()
                
                recommendations = json.loads(response_text)
                if isinstance(recommendations, list) and len(recommendations) > 0:
                    return recommendations
            except Exception as e:
                print(f"Gemini AI error, falling back to rules: {e}")

        # Fallback rule-based engine
        recommendations = []
        
        # Accessing data safely with defaults
        rainfall = farm_profile.get('rainfall', 800.0)
        temp = farm_profile.get('temperature', 25.0)
        soil = farm_profile.get('soil_type', 'Loamy').lower()
        
        # 1. Rice
        if rainfall > 1000 and temp > 25:
            recommendations.append({
                "crop_name": "Rice",
                "reason": "High rainfall and warm temperature match rice cultivation needs.",
                "water_need": "High",
                "care_level": "Moderate",
                "time_to_harvest": "4 months"
            })
            
        # 2. Corn
        if 500 < rainfall < 1000 and 20 < temp < 30:
            recommendations.append({
                "crop_name": "Corn",
                "reason": "Moderate water and warm climate are ideal for corn/maize.",
                "water_need": "Moderate",
                "care_level": "Low",
                "time_to_harvest": "3 months"
            })
            
        # 3. Sugarcane
        if temp > 20 and farm_profile.get('water_availability') == "High":
            recommendations.append({
                "crop_name": "Sugarcane",
                "reason": "Relies on consistent water and warm weather.",
                "water_need": "Very High",
                "care_level": "Moderate",
                "time_to_harvest": "12 months"
            })
            
        # Fallback if no match
        if not recommendations:
            recommendations.append({
                "crop_name": "Cassava",
                "reason": "Resilient drought-tolerant crop suitable for various terrains.",
                "water_need": "Low",
                "care_level": "Minimal",
                "time_to_harvest": "9 months"
            })
            
        return recommendations

    @staticmethod
    async def get_recommendations_for_farm(profile_id: str):
        db = get_database()
        return await db.crop_recommendations.find_one({"farm_profile_id": profile_id})

    @staticmethod
    async def save_recommendations(profile_id: str, recommendations: List[dict]):
        db = get_database()
        
        rec_data = {
            "farm_profile_id": profile_id,
            "recommended_crops": recommendations,
            "selected_crop": None,
            "created_at": datetime.now()
        }
        
        # Use upsert to prevent multiple entries for the same profile
        result = await db.crop_recommendations.update_one(
            {"farm_profile_id": profile_id},
            {"$set": rec_data},
            upsert=True
        )
        return recommendations

    @staticmethod
    def validate_crop(farm_profile: dict, crop_name: str) -> dict:
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        if gemini_api_key:
            try:
                genai.configure(api_key=gemini_api_key)
                model = genai.GenerativeModel("gemini-1.5-pro-latest")
                prompt = f"""
                You are an expert agronomist AI.
                Evaluate if the crop '{crop_name}' is suitable for this farm profile:
                {json.dumps(farm_profile)}
                
                Respond ONLY with a raw JSON object (no markdown, no quotes) with this structure:
                {{
                    "crop_name": "{crop_name}",
                    "is_suitable": true/false (boolean),
                    "reason": "Expert rationale in 1-2 sentences",
                    "water_need": "Low/Moderate/High",
                    "care_level": "Minimal/Low/Moderate/High",
                    "time_to_harvest": "Estimated duration (e.g. 3 months)",
                    "alternatives": ["Crop A", "Crop B"] // Only if is_suitable=false, else empty array
                }}
                """
                response = model.generate_content(prompt)
                resp_text = response.text.replace("```json", "").replace("```", "").strip()
                return json.loads(resp_text)
            except Exception as e:
                print(f"Gemini API Error (Validate): {e}")

        # Fallback simulation
        is_suitable = 'rice' in crop_name.lower() or 'clay' in farm_profile.get('soil_type', '').lower()
        return {
            "crop_name": crop_name,
            "is_suitable": is_suitable,
            "reason": f"Fallback: Analysis for {crop_name}.",
            "water_need": "Medium to High",
            "care_level": "Moderate",
            "time_to_harvest": "3-4 Months",
            "alternatives": [] if is_suitable else ["Corn", "Beans"]
        }

    @staticmethod
    async def update_selected_crop(profile_id: str, crop_name: str):
        db = get_database()
        await db.crop_recommendations.update_one(
            {"farm_profile_id": profile_id},
            {"$set": {"selected_crop": crop_name}}
        )

recommendation_service = RecommendationService()
