import os
import json
import google.generativeai as genai
from datetime import datetime
from typing import Dict, List, Optional
from ai_models.agricultural_field_detector import agricultural_field_detector

class PostHarvestService:
    def __init__(self):
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)

    async def _analyze_image(self, prompt: str, image_bytes: bytes) -> Dict:
        """Helper to run Gemini Vision analysis."""
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            image_part = {"mime_type": "image/jpeg", "data": image_bytes}
            response = model.generate_content([prompt, image_part])
            
            text = response.text.strip()
            # Extract JSON from potential markdown blocks
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            return json.loads(text)
        except Exception as e:
            print(f"Post-Harvest Vision Error: {e}")
            return {"error": str(e)}

    async def _get_text_recommendation(self, prompt: str) -> Dict:
        """Helper to run Gemini Text recommendation."""
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            return json.loads(text)
        except Exception as e:
            print(f"Post-Harvest Text Error: {e}")
            return {"error": str(e)}

    async def validate_agricultural_field(self, image_bytes: bytes, expected_crop: str = None) -> Dict:
        """
        Validate if image is from an agricultural field before analysis.
        Returns validation result with recommendations.
        """
        # First check: Is it an agricultural field?
        field_result = await agricultural_field_detector.is_agricultural_field(image_bytes)
        
        if not field_result.get("is_agricultural", False):
            return {
                "valid": False,
                "is_agricultural": False,
                "error": "Image does not appear to be from an agricultural field",
                "recommendation": field_result.get("recommendation", "Please upload a clear agricultural field image"),
                "analysis": field_result.get("analysis", "Not an agricultural setting"),
                "confidence": field_result.get("confidence", 0)
            }
        
        # Second check: If crop specified, verify it matches
        if expected_crop:
            crop_result = await agricultural_field_detector.get_crop_confidence(image_bytes, expected_crop)
            
            if crop_result.get("confidence", 0) < 0.5:
                return {
                    "valid": False,
                    "is_agricultural": True,
                    "field_type": field_result.get("field_type"),
                    "error": f"Image appears to be {crop_result.get('identified_crop', 'unknown')}, not {expected_crop}",
                    "identified_crop": crop_result.get("identified_crop"),
                    "detected_crops": field_result.get("detected_crops", []),
                    "recommendation": f"Please upload an image of {expected_crop}",
                    "crop_confidence": crop_result.get("confidence", 0)
                }
        
        # All validations passed
        return {
            "valid": True,
            "is_agricultural": True,
            "field_type": field_result.get("field_type"),
            "detected_crops": field_result.get("detected_crops", []),
            "analysis": field_result.get("analysis"),
            "confidence": field_result.get("confidence", 1)
        }

    # 1. Harvest Readiness
    async def check_readiness(self, image_bytes: bytes, crop: str) -> Dict:
        # Validate image first
        validation = await self.validate_agricultural_field(image_bytes, crop)
        if not validation.get("valid", False):
            return validation
        
        prompt = f"""
        Analyze this {crop} image for harvest readiness.
        Return JSON structure:
        {{
            "status": "Ready" | "Too Early" | "Overripe",
            "confidence": 0-1,
            "analysis": "1-2 sentences on visual cues",
            "recommendation": "What should the farmer do next"
        }}
        """
        result = await self._analyze_image(prompt, image_bytes)
        if not result.get("error"):
            result["valid"] = True
            result["field_validation"] = validation
        return result

    # 2. Harvesting Guidance
    async def get_harvesting_guidance(self, crop: str) -> Dict:
        prompt = f"""
        Provide professional harvesting guidance for {crop}.
        Return JSON structure:
        {{
            "best_time": "Optimal time of day / weather",
            "precautions": ["Prec 1", "Prec 2"],
            "handling_tips": ["Tip 1", "Tip 2"],
            "tools_needed": ["Tool 1", "Tool 2"]
        }}
        """
        return await self._get_text_recommendation(prompt)

    # 3. Quality Grading
    async def grade_quality(self, image_bytes: bytes, crop: str) -> Dict:
        # Validate image first
        validation = await self.validate_agricultural_field(image_bytes, crop)
        if not validation.get("valid", False):
            return validation
        
        prompt = f"""
        Assess the quality of this harvested {crop}.
        Return JSON structure:
        {{
            "grade": "Grade A" | "Grade B" | "Grade C",
            "attributes": {{
                "freshness": "Excellent/Good/Fair/Poor",
                "size_consistency": "High/Medium/Low",
                "color_uniformity": "High/Medium/Low"
            }},
            "market_value_estimate": "High/Medium/Low",
            "rationale": "Expert explanation"
        }}
        """
        result = await self._analyze_image(prompt, image_bytes)
        if not result.get("error"):
            result["valid"] = True
            result["field_validation"] = validation
        return result

    # 4. Damage Detection
    async def detect_damage(self, image_bytes: bytes, crop: str) -> Dict:
        # Validate image first
        validation = await self.validate_agricultural_field(image_bytes, crop)
        if not validation.get("valid", False):
            return validation
        
        prompt = f"""
        Detect physical or insect damage on this {crop}.
        Return JSON structure:
        {{
            "damage_found": true/false,
            "defects": ["List of detected issues like bruises, cuts, etc."],
            "severity": "Low/Moderate/Serious",
            "action": "Immediate action needed?"
        }}
        """
        result = await self._analyze_image(prompt, image_bytes)
        if not result.get("error"):
            result["valid"] = True
            result["field_validation"] = validation
        return result

    # 5. Cleaning & Sorting
    async def get_cleaning_sorting_guidance(self, crop: str) -> Dict:
        prompt = f"""
        Provide cleaning and sorting steps for {crop}.
        Return JSON structure:
        {{
            "cleaning_method": "Wash / Dry Clean / Brush",
            "sorting_criteria": ["Criterion 1", "Criterion 2"],
            "separation_advice": "What to separate"
        }}
        """
        return await self._get_text_recommendation(prompt)

    # 6. Drying / Curing
    async def get_drying_curing_guidance(self, crop: str) -> Dict:
        prompt = f"""
        Provide drying and curing guidance for {crop}.
        Return JSON structure:
        {{
            "method": "Sun drying / Mechanical / Curing room",
            "moisture_target": "Percentage %",
            "duration": "Estimated time",
            "is_required": true/false
        }}
        """
        return await self._get_text_recommendation(prompt)

    # 7. Storage
    async def get_storage_recommendation(self, crop: str) -> Dict:
        prompt = f"""
        Provide storage specs for {crop}.
        Return JSON structure:
        {{
            "storage_type": "Cold Storage / Ambient / Silo",
            "ideal_temp": "Range in Celsius",
            "ideal_humidity": "Percentage %",
            "ventilation": "Requirement description",
            "max_duration": "Time period"
        }}
        """
        return await self._get_text_recommendation(prompt)

    # 8. Spoilage Detection
    async def detect_spoilage(self, image_bytes: bytes, crop: str) -> Dict:
        # Validate image first
        validation = await self.validate_agricultural_field(image_bytes, crop)
        if not validation.get("valid", False):
            return validation
        
        prompt = f"""
        Check for mold, rot, or decay in this stored {crop}.
        Return JSON structure:
        {{
            "spoilage_detected": true/false,
            "type": "Mold/Fungal/Rot/None",
            "contagion_risk": "High/Medium/Low",
            "emergency_action": "What to do with the batch"
        }}
        """
        result = await self._analyze_image(prompt, image_bytes)
        if not result.get("error"):
            result["valid"] = True
            result["field_validation"] = validation
        return result

    # 9. Packaging
    async def get_packaging_guidance(self, crop: str) -> Dict:
        prompt = f"""
        Recommend packaging for {crop}.
        Return JSON structure:
        {{
            "packaging_type": "Crates / Bags / Cartons",
            "inner_lining": "Yes/No/Type",
            "padding": "Requirement description"
        }}
        """
        return await self._get_text_recommendation(prompt)

    # 10. Transportation
    async def get_transport_guidance(self, crop: str) -> Dict:
        prompt = f"""
        Provide transport handling for {crop}.
        Return JSON structure:
        {{
            "vehicle_type": "Refrigerated / Open truck / etc.",
            "stacking_limit": "Max layers",
            "handling_care": "Critical handling tips"
        }}
        """
        return await self._get_text_recommendation(prompt)

    # 11. Shelf Life
    async def predict_shelf_life(self, crop: str, storage_condition: str) -> Dict:
        prompt = f"""
        Predict shelf life for {crop} under {storage_condition} conditions.
        Return JSON structure:
        {{
            "estimated_days": integer,
            "spoilage_period": "When risk increases",
            "quality_retention_tips": ["Tip 1", "Tip 2"]
        }}
        """
        return await self._get_text_recommendation(prompt)

    # 12. Sell/Store Decision
    async def get_market_decision(self, crop: str, grade: str) -> Dict:
        prompt = f"""
        Decision support for {crop} of {grade} quality.
        Return JSON structure:
        {{
            "decision": "Sell Immediately / Store / Auction",
            "strategic_reason": "Rationale based on grade and storage capability",
            "estimated_profitability": "High/Medium/Low"
        }}
        """
        return await self._get_text_recommendation(prompt)

    # 13. Phase Detection
    async def detect_current_phase(self, image_bytes: bytes, crop: str) -> Dict:
        # Validate image first
        validation = await self.validate_agricultural_field(image_bytes, crop)
        if not validation.get("valid", False):
            return validation
        
        prompt = f"""
        Look at this {crop} image and determine which post-harvest phase it belongs to.
        Options: harvesting, cleaning, drying, storage, packaging, transport.
        Return JSON structure:
        {{
            "detected_phase": "one of the options above",
            "confidence": 0-1,
            "reasoning": "1 sentence why",
            "further_steps": "A short, actionable instruction on what the farmer should do immediately after this phase to preserve quality."
        }}
        """
        result = await self._analyze_image(prompt, image_bytes)
        if not result.get("error"):
            result["valid"] = True
            result["field_validation"] = validation
        return result

post_harvest_service = PostHarvestService()
