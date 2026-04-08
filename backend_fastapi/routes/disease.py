from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from services.disease_service import disease_service
from typing import Optional

router = APIRouter()

@router.post("/predict")
async def predict_disease(
    farm_profile_id: str = Form(...),
    selected_crop: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Receives an image of a crop and predicts potential diseases using AI.
    Integrates with Gemini 1.5 Pro for agricultural-grade detection.
    """
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image.")

        # Read image bytes
        image_bytes = await file.read()
        
        # Call the service
        result = await disease_service.predict_disease(
            profile_id=farm_profile_id,
            crop_name=selected_crop,
            image_bytes=image_bytes,
            filename=file.filename
        )
        
        return {
            "success": True,
            "predicted_disease": result.get("predicted_disease"),
            "confidence": result.get("confidence"),
            "symptoms": result.get("symptoms"),
            "severity": result.get("severity"),
            "recommendation": result.get("recommendation"),
            "raw_result": result
        }

    except Exception as e:
        print(f"Server Error in Prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Prediction failed: {str(e)}")
