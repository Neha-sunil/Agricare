import os
import google.generativeai as genai
from dotenv import load_dotenv

def list_models():
    # Load env for local key
    load_dotenv("backend_fastapi/.env")
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        print("❌ No API key found in backend_fastapi/.env")
        return

    try:
        genai.configure(api_key=api_key)
        print("--- Available Models ---")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Model: {m.name} (Short: {m.name.split('/')[-1]})")
    except Exception as e:
        print(f"❌ Error listing models: {e}")

if __name__ == "__main__":
    list_models()
