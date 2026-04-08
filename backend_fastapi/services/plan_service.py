import os
import json
import google.generativeai as genai
from typing import Dict, List

class PlanService:
    @staticmethod
    def generate_precare_plan(selected_crop: str, profile: dict = None) -> Dict[str, List[str]]:
        """AI-style plan generation based on selected crop and real-time profile data."""
        if not profile: profile = {}
        
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        if gemini_api_key:
            try:
                genai.configure(api_key=gemini_api_key)
                # Using 2.0-flash for insanely fast logic processing
                model = genai.GenerativeModel("gemini-2.0-flash")
                
                # Extract farmer specific details for a customized plan
                location = profile.get("location", "Unknown Location")
                soil = profile.get("soil_type", "Standard Soil")
                area = profile.get("land_area", "Unknown")
                irrigation = profile.get("irrigation_system", "Standard")
                
                prompt = f"""
                You are an expert master agronomist. Generate a highly customized 6-phase pre-care cultivation plan for {selected_crop}.
                Use this real-time farmer data to customize the tasks: 
                - Location/Climate: {location}
                - Soil Type: {soil}
                - Real Estate: {area} Rai
                - Irrigation: {irrigation}
                
                Return a strictly formatted JSON object (no markdown, no quotes) with this exact structure:
                {{
                    "soil_preparation": ["Task 1", "Task 2"],
                    "seed_preparation": ["Task 1", "Task 2"],
                    "fertilizer_plan": ["Task 1", "Task 2"],
                    "irrigation_plan": ["Task 1", "Task 2"],
                    "pest_prevention_plan": ["Task 1", "Task 2"],
                    "growth_monitoring_plan": ["Task 1", "Task 2"]
                }}
                Provide 2 highly specific, realistic, and expert-level tasks per phase that explicitly account for {soil} soil and the {irrigation} irrigation system in {location}.
                """
                response = model.generate_content(prompt)
                resp_text = response.text.replace("```json", "").replace("```", "").strip()
                return json.loads(resp_text)
            except Exception as e:
                print(f"Gemini API Error (Plan): {e}")

        # Fallback plan for any other crops
        return {
            "soil_preparation": ["Deep Ploughing", "Adding basic manure"],
            "seed_preparation": ["Checking seed quality"],
            "fertilizer_plan": ["Basic NPK application"],
            "irrigation_plan": ["Standard watering schedule"],
            "pest_prevention_plan": ["Standard pest monitoring"],
            "growth_monitoring_plan": ["Daily visual checks"]
        }

    @staticmethod
    def generate_weekly_tasks(selected_crop: str, plan: Dict[str, List[str]]) -> List[Dict]:
        """Convert a comprehensive plan into individual weekly tasks."""
        tasks = []
        
        # Week 1: Soil Preparation
        for item in plan.get("soil_preparation", []):
            tasks.append({
                "title": item,
                "description": f"Perform initial soil prep for {selected_crop}: {item}",
                "category": "Soil",
                "week_number": 1
            })
            
        # Week 2: Seed Preparation
        for item in plan.get("seed_preparation", []):
            tasks.append({
                "title": item,
                "description": f"Complete seed preparation for {selected_crop}: {item}",
                "category": "Seed",
                "week_number": 2
            })
            
        # Week 3-4: Planting & Fertilizer
        for item in plan.get("fertilizer_plan", []):
            tasks.append({
                "title": item,
                "description": f"Manage fertilization for {selected_crop}: {item}",
                "category": "Fertilizer",
                "week_number": 3
            })
            
        # Week 4: Irrigation
        for item in plan.get("irrigation_plan", []):
            tasks.append({
                "title": item,
                "description": f"Manage watering for {selected_crop}: {item}",
                "category": "Irrigation",
                "week_number": 4
            })
            
        # Week 5: Pest Control
        for item in plan.get("pest_prevention_plan", []):
            tasks.append({
                "title": item,
                "description": f"Handle pest prevention for {selected_crop}: {item}",
                "category": "Pest Control",
                "week_number": 5
            })

        # Week 6: Monitoring
        for item in plan.get("growth_monitoring_plan", []):
            tasks.append({
                "title": item,
                "description": f"Analyze growth patterns for {selected_crop}: {item}",
                "category": "Monitoring",
                "week_number": 6
            })
            
        return tasks

plan_service = PlanService()
