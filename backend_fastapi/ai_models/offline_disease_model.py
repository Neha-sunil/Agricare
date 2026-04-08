import io
from PIL import Image
try:
    from transformers import pipeline
except ImportError:
    pipeline = None

class OfflineDiseasePredictor:
    def __init__(self):
        # We use a pre-trained MobileNetV2 fine-tuned on the PlantVillage dataset
        # which can detect 38 different plant disease classes.
        # This will download the model weights (~100MB) on the first run.
        if pipeline:
            print("Loading Offline Plant Disease Model...")
            self.classifier = pipeline("image-classification", model="linkanjarad/mobilenet_v2_plant_disease")
        else:
            self.classifier = None
            
        # Recommendations mapped to diseases
        self.treatment_db = {
            "Tomato___Bacterial_spot": "Apply copper-based fungicides. Remove and destroy infected leaves.",
            "Tomato___Late_blight": "Apply fungicides like chlorothalonil. Improve air circulation.",
            "Potato___Early_blight": "Use fungicides containing mancozeb or copper. Implement crop rotation.",
            "Potato___Late_blight": "Destroy infected plants. Treat with fungicides like metalaxyl.",
            "Apple___Apple_scab": "Use fungicides preventatively in spring. Rake and destroy fallen leaves.",
            "Corn_(maize)___Common_rust_": "Use resistant hybrids. Apply fungicides if infection is severe.",
            "Grape___Black_rot": "Remove infected plant parts. Apply captan or mancozeb fungicides.",
            "Healthy": "No treatment needed! Maintain regular watering and fertilization."
            # ... can be expanded for all 38 classes
        }

    def predict(self, image_bytes: bytes) -> dict:
        """
        Predict disease from image bytes offline.
        """
        if not self.classifier:
            return {
                "error": "Transformers library not installed. Run: pip install transformers torch torchvision Pillow"
            }
            
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Get predictions
        results = self.classifier(image)
        
        # Results is a list of dicts: [{'label': 'Tomato___Bacterial_spot', 'score': 0.98}, ...]
        top_prediction = results[0]
        disease_label = top_prediction['label']
        confidence = round(top_prediction['score'] * 100, 2)
        
        # Format the label nicely (e.g. "Tomato___Bacterial_spot" -> "Tomato Bacterial Spot")
        formatted_label = disease_label.replace("___", " - ").replace("_", " ").title()
        
        # Fetch recommendation or a default one
        recommendation = self.treatment_db.get(disease_label, "Consult local agricultural extension for optimal treatment.")
        
        # Determine Severity based on Confidence and Health status
        severity = "High" if confidence > 80 and "healthy" not in disease_label.lower() else "Low"
        if "healthy" in disease_label.lower():
            severity = "None"
            recommendation = self.treatment_db["Healthy"]

        return {
            "predicted_disease": formatted_label,
            "confidence": confidence,
            "symptoms": f"Visual symptoms match {formatted_label}.",
            "severity": severity,
            "recommendation": recommendation,
            "source": "Offline ML Pipeline (MobileNetV2)"
        }

# Example usage if run directly:
if __name__ == "__main__":
    print("Offline Model ready!. To use this, install requirements:")
    print("pip install transformers torch Pillow")
