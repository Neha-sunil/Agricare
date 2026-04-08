import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

try:
    genai.configure(api_key=api_key)
    models = list(genai.list_models())
    for m in models[:20]: # Show more
        print(f"MODEL: {m.name}")
except Exception as e:
    print("FAILED:", str(e))
