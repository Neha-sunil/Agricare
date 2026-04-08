from fastapi import APIRouter, HTTPException
from datetime import datetime
from bson import ObjectId

from db.mongo import get_database
from schemas.farm import AssistantQueryInput, AssistantResponse
from services.assistant_service import assistant_service

router = APIRouter()

@router.post("/query", response_model=AssistantResponse)
async def query_assistant(query_input: AssistantQueryInput):
    db = get_database()
    profile_id = query_input.farm_profile_id or "guest_user"
    
    # 1. Fetch search context
    session = await db.assistant_sessions.find_one({"farm_profile_id": profile_id})
    profile = await db.farm_profiles.find_one({"farm_profile_id": profile_id})
    
    if not session:
        rec = await db.crop_recommendations.find_one({"farm_profile_id": profile_id})
        selected_crop = rec.get("selected_crop", "unknown crop") if rec else "unknown crop"
        session = {"farm_profile_id": profile_id, "selected_crop": selected_crop, "current_week": 1, "chat_history": []}
        await db.assistant_sessions.insert_one(session)
    
    # Enrich session with profile data for the service
    context = {**session}
    if profile:
        context['soil_type'] = profile.get('soil_type', 'standard soil')
        context['location'] = profile.get('location', 'Thailand')

    # 2. Detect Language & Get Response from AI
    is_thai = any('\u0e00' <= char <= '\u0e7f' for char in query_input.query_text)
    lang = query_input.lang if query_input.lang else ('TH' if is_thai else 'EN')
    
    response_text, spoken_summary = assistant_service.get_response(
        query_input.query_text, 
        context, 
        chat_history=session.get("chat_history", []), 
        lang=lang
    )
    
    # 3. Save History
    chat_entry = {"user": query_input.query_text, "bot": response_text, "timestamp": datetime.now()}
    await db.assistant_sessions.update_one(
        {"farm_profile_id": profile_id},
        {"$push": {"chat_history": chat_entry}}
    )
    
    # Simple intent detector for analytics
    detected_intent = "general_query"
    
    return {
        "detected_intent": detected_intent,
        "response": response_text,
        "spoken_summary": spoken_summary,
        "data": {"current_week": session.get("current_week", 1), "selected_crop": session.get("selected_crop", "unknown crop")}
    }
