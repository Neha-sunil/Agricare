import os
import json
import google.generativeai as genai
from typing import List, Dict
from datetime import datetime, timedelta
from db.mongo import get_database
from bson import ObjectId

class AuctionService:
    def __init__(self):
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)
            self.model = genai.GenerativeModel("gemini-1.5-pro-latest")
        else:
            self.model = None

    async def get_market_intelligence(self) -> Dict:
        """Fetch real-time market trends and demand."""
        # In a real app, this would fetch from an external API
        # Here we simulate with AI or static data
        
        if self.model:
            try:
                prompt = """
                You are a real-time agricultural market intelligence engine.
                Generate a dynamic market status report for major crops in Thailand (Rice, Tomato, Onion, Chili, Mango, Cassava).
                Return a JSON object with:
                - "market_prices": array of { "crop": str, "price": float, "trend": "up"|"down"|"stable", "avg_price": float, "high": float, "low": float }
                - "high_demand_crops": array of { "crop": str, "urgency": "High"|"Medium", "reason": str }
                - "nearby_opportunities": array of { "zone": str, "top_crop": str, "demand_level": str }
                
                Use realistic price ranges in THB. Return ONLY raw JSON.
                """
                response = self.model.generate_content(prompt)
                resp_text = response.text.replace("```json", "").replace("```", "").strip()
                return json.loads(resp_text)
            except Exception as e:
                print(f"Gemini Market Intelligence Error: {e}")

        # Fallback static data
        return {
            "market_prices": [
                {"crop": "Rice", "price": 14.5, "trend": "up", "avg_price": 13.8, "high": 15.2, "low": 12.5},
                {"crop": "Tomato", "price": 28.0, "trend": "up", "avg_price": 24.0, "high": 32.0, "low": 18.0},
                {"crop": "Onion", "price": 22.0, "trend": "down", "avg_price": 25.0, "high": 30.0, "low": 15.0},
                {"crop": "Chili", "price": 45.0, "trend": "up", "avg_price": 40.0, "high": 55.0, "low": 35.0}
            ],
            "high_demand_crops": [
                {"crop": "Tomato", "urgency": "High", "reason": "Shortage in nearby provinces due to weather."},
                {"crop": "Chili", "urgency": "Medium", "reason": "Steady export demand increase."}
            ],
            "nearby_opportunities": [
                {"zone": "Bangkok Central Market", "top_crop": "Tomato", "demand_level": "Extreme"},
                {"zone": "Chonburi Hub", "top_crop": "Rice", "demand_level": "High"}
            ]
        }

    async def get_sell_recommendation(self, auction_data: Dict) -> Dict:
        """AI decision support for sell vs store."""
        if self.model:
            try:
                prompt = f"""
                Analyze this auction listing and market context to provide a selling strategy:
                Listing: {json.dumps(auction_data)}
                
                Return a JSON object with:
                - "recommendation": "Sell Now" | "Wait" | "Store" | "Auction Immediately"
                - "reason": "Expert rationale"
                - "suggested_starting_bid": float
                - "safe_selling_range": [min, max]
                - "sale_probability": str (e.g. "85%")
                - "expected_profit_insight": str
                
                Focus on spoilage risk if shelf life is low. Return ONLY raw JSON.
                """
                response = self.model.generate_content(prompt)
                resp_text = response.text.replace("```json", "").replace("```", "").strip()
                return json.loads(resp_text)
            except Exception as e:
                print(f"Gemini Recommendation Error: {e}")

        return {
            "recommendation": "Sell Now",
            "reason": "Market prices are currently at a 2-week high for this crop grade.",
            "suggested_starting_bid": auction_data.get('expected_price', 0) * 0.9,
            "safe_selling_range": [auction_data.get('expected_price', 0) * 0.9, auction_data.get('expected_price', 0) * 1.2],
            "sale_probability": "High",
            "expected_profit_insight": "Expecting 15% above average market rate."
        }

    async def create_listing(self, data: Dict):
        db = get_database()
        data["created_at"] = datetime.now()
        data["status"] = "active"
        data["current_highest_bid"] = 0
        data["total_bids"] = 0
        result = await db.auctions.insert_one(data)
        return str(result.inserted_id)

    async def get_all_listings(self):
        db = get_database()
        cursor = db.auctions.find({}).sort("created_at", -1)
        listings = []
        async for l in cursor:
            l["_id"] = str(l["_id"])
            listings.append(l)
        return listings

    async def get_farmer_listings(self, profile_id: str):
        db = get_database()
        cursor = db.auctions.find({"farm_profile_id": profile_id}).sort("created_at", -1)
        listings = []
        async for l in cursor:
            l["_id"] = str(l["_id"])
            listings.append(l)
        return listings

    async def place_bid(self, auction_id: str, buyer_name: str, amount: float):
        db = get_database()
        # In a real app, check if amount is higher than current
        await db.auctions.update_one(
            {"_id": ObjectId(auction_id)},
            {
                "$set": {"current_highest_bid": amount},
                "$inc": {"total_bids": 1},
                "$push": {"bids": {"buyer": buyer_name, "amount": amount, "time": datetime.now()}}
            }
        )
        return True

auction_service = AuctionService()
