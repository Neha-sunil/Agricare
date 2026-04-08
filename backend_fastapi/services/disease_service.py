import os
import google.generativeai as genai
from datetime import datetime
from db.mongo import get_database
from bson import ObjectId
import json
import httpx
import base64

class DiseaseService:
    def __init__(self):
        self.gemini_api_key = os.environ.get("GEMINI_API_KEY")
        self.kindwise_key = os.environ.get("KINDWISE_API_KEY")
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)

    async def predict_disease(self, profile_id: str, crop_name: str, image_bytes: bytes, filename: str):
        # Try Kindwise First
        if self.kindwise_key:
            try:
                kindwise_result = await self._call_kindwise_health(image_bytes)
                if kindwise_result:
                    # Save to MongoDB
                    await self._save_prediction(profile_id, crop_name, filename, kindwise_result)
                    return kindwise_result
            except Exception as e:
                print(f"⚠️ Kindwise failed, falling back to Gemini: {e}")

        # Fallback to Gemini
        return await self._call_gemini_disease(profile_id, crop_name, image_bytes, filename)

    async def _call_kindwise_health(self, image_bytes: bytes):
        base64_img = base64.b64encode(image_bytes).decode('utf-8')
        
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://plant.id/api/v3/health_assessment",
                headers={"Api-Key": self.kindwise_key, "Content-Type": "application/json"},
                json={
                    "images": [f"data:image/jpeg;base64,{base64_img}"],
                    "latitude": 13.736,
                    "longitude": 100.523, 
                    "similar_images": True,
                    "extra_details": ["description", "treatment", "cause"]
                },
                timeout=30.0
            )
            
            if res.status_code != 201:
                print(f"Kindwise Error {res.status_code}: {res.text}")
                return None
            
            data = res.json()
            # Extract first health result
            health = data.get('result', {}).get('is_healthy', {})
            suggestions = data.get('result', {}).get('disease_suggestions', [])
            
            top_disease = suggestions[0] if suggestions else {"name": "Unknown", "probability": 0}
            
            return {
                "predicted_disease": top_disease.get('name', 'Healthy' if health.get('binary') else 'Unknown Issue'),
                "confidence": top_disease.get('probability', 1.0 if health.get('binary') else 0.5),
                "symptoms": top_disease.get('details', {}).get('description', 'Consult expert for details.'),
                "severity": 'Moderate' if not health.get('binary') else 'Low',
                "recommendation": top_disease.get('details', {}).get('treatment', {}).get('biological', ['No specific treatment found'])[0],
                "source": "Kindwise AI"
            }

    async def _call_gemini_disease(self, profile_id, crop_name, image_bytes, filename):
        # Fallback chain for Gemini models that are actually available for this user
        models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
        prompt = f"Analyze this {crop_name} image for diseases. Return JSON: predicted_disease, confidence, symptoms, severity, recommendation."
        
        last_error = ""
        for model_name in models_to_try:
            try:
                model = genai.GenerativeModel(model_name)
                image_part = {"mime_type": "image/jpeg", "data": image_bytes}
                response = model.generate_content([prompt, image_part])
                text = response.text.strip()
                if "```json" in text: text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text: text = text.split("```")[1].split("```")[0].strip()
                
                result = json.loads(text)
                result["source"] = f"Gemini AI ({model_name})"
                await self._save_prediction(profile_id, crop_name, filename, result)
                return result
            except Exception as e:
                print(f"❌ Gemini {model_name} failed: {e}")
                last_error = str(e)
                continue

        return {
            "predicted_disease": "System Busy", 
            "confidence": 0, 
            "symptoms": f"We are processing high volumes. Error: {last_error}", 
            "severity": "Unknown", 
            "recommendation": "Please try again in 1 minute or check your internet connection.",
            "source": "Failsafe System"
        }

    async def _save_prediction(self, profile_id, crop_name, filename, result):
        db = get_database()
        await db.disease_predictions.insert_one({
            "farm_profile_id": profile_id,
            "selected_crop": crop_name,
            "filename": filename,
            **result,
            "created_at": datetime.utcnow()
        })

disease_service = DiseaseService()
