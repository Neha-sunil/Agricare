import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

try:
    genai.configure(api_key=api_key)
    # Check if gemini-pro (the older 1.0) works
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content("Hello, wave at me.")
    print("SUCCESS (gemini-pro):", response.text)
except Exception as e:
    print("FAILED (gemini-pro):", str(e))
