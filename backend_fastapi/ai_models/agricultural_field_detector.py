"""
Agricultural Field Detection using Pretrained Model
This module identifies whether an image is from an agricultural field/crop
"""

import io
import os
import json
import numpy as np
from PIL import Image
import google.generativeai as genai

class AgriculturalFieldDetector:
    """
    Detects whether an image is from an agricultural field using vision analysis.
    Uses Gemini Vision for reliable field detection.
    """
    
    def __init__(self):
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")
    
    async def is_agricultural_field(self, image_bytes: bytes) -> dict:
        """
        Determine if the image is from an agricultural field/farm.
        
        Args:
            image_bytes: Image data as bytes
            
        Returns:
            {
                "is_agricultural": True/False,
                "confidence": 0-1,
                "field_type": "crop_field" | "orchard" | "livestock" | "non_agricultural",
                "detected_crops": ["crop1", "crop2"],
                "analysis": "Brief description",
                "recommendation": "What to do next"
            }
        """
        try:
            prompt = """
You are an expert agricultural field detector. Analyze this image and determine:
1. Is this an agricultural field/farm/orchard? (Yes/No)
2. What type of agricultural setting? (crop_field/orchard/livestock/greenhouse/non_agricultural)
3. What crops or plants are visible? List them.
4. Confidence level (0-1) in your assessment.

Return as JSON only (no markdown, no code blocks):
{
    "is_agricultural": true/false,
    "confidence": 0-1 number,
    "field_type": "crop_field|orchard|livestock|greenhouse|non_agricultural",
    "detected_crops": ["crop1", "crop2"],
    "analysis": "one sentence analysis",
    "recommendation": "Clear next step for the farmer if agricultural, or message if not"
}

STRICT: Return ONLY valid JSON, nothing else.
"""
            
            image_part = {"mime_type": "image/jpeg", "data": image_bytes}
            response = self.model.generate_content([prompt, image_part])
            
            text = response.text.strip()
            
            # Try to extract JSON from potential markdown blocks
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(text)
            
            # Validate result structure
            if "is_agricultural" not in result:
                result["is_agricultural"] = False
            if "confidence" not in result:
                result["confidence"] = 0
            if "field_type" not in result:
                result["field_type"] = "non_agricultural"
            if "detected_crops" not in result:
                result["detected_crops"] = []
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error in field detection: {e}")
            return {
                "is_agricultural": False,
                "confidence": 0,
                "field_type": "non_agricultural",
                "detected_crops": [],
                "analysis": "Could not analyze image",
                "recommendation": "Please upload a clear agricultural field image",
                "error": str(e)
            }
        except Exception as e:
            print(f"Field Detection Error: {e}")
            return {
                "is_agricultural": False,
                "confidence": 0,
                "field_type": "non_agricultural",
                "detected_crops": [],
                "analysis": "Error processing image",
                "recommendation": "Please try again with another image",
                "error": str(e)
            }
    
    async def get_crop_confidence(self, image_bytes: bytes, expected_crop: str) -> dict:
        """
        Check if the image matches the expected crop with confidence.
        
        Args:
            image_bytes: Image data as bytes
            expected_crop: The crop name we expect to find
            
        Returns:
            {
                "crop_match": True/False,
                "confidence": 0-1,
                "identified_crop": "crop name",
                "is_harvest_ready": True/False/Unknown,
                "analysis": "Description"
            }
        """
        try:
            prompt = f"""
Analyze this image and answer:
1. Is this the {expected_crop} crop or plant? (Yes/No/Uncertain)
2. What crop do you actually see? Name it.
3. Does it appear ready for harvest? (Yes/No/Uncertain)
4. Confidence (0-1) in your identification.

Return as JSON only:
{{
    "crop_match": true/false,
    "identified_crop": "the actual crop name",
    "is_harvest_ready": true/false,
    "confidence": 0-1,
    "analysis": "one sentence"
}}

STRICT: Return ONLY JSON.
"""
            
            image_part = {"mime_type": "image/jpeg", "data": image_bytes}
            response = self.model.generate_content([prompt, image_part])
            
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(text)
            
            # Validate
            if "crop_match" not in result:
                result["crop_match"] = False
            if "confidence" not in result:
                result["confidence"] = 0
            
            return result
            
        except Exception as e:
            print(f"Crop Confidence Error: {e}")
            return {
                "crop_match": False,
                "confidence": 0,
                "identified_crop": "Unknown",
                "is_harvest_ready": None,
                "analysis": "Could not identify crop",
                "error": str(e)
            }

# Singleton instance
agricultural_field_detector = AgriculturalFieldDetector()
