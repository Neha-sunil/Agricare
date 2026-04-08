import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

try:
    genai.configure(api_key=api_key)
    print("TOP MODELS:")
    idx = 0
    for m in genai.list_models():
        print(f"MODEL_{idx}: {m.name}")
        idx += 1
        if idx > 10: break
except Exception as e:
    print("FAILED:", str(e))
