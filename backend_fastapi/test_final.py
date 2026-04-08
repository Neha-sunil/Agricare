import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

try:
    genai.configure(api_key=api_key)
    # Testing the model we found in models.txt
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content("What causes yellow leaves with brown spots in plants?")
    print("SUCCESS (2.0-flash):", response.text)
except Exception as e:
    print("FAILED (2.0-flash):", str(e))
