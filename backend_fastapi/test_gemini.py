import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"Testing with API Key: {api_key[:10]}...")

try:
    genai.configure(api_key=api_key)
    # Try a very simple call without system instructions first to check key validity
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content("Hello, wave at me.")
    print("SUCCESS (Simple):", response.text)
    
    # Try with system instruction
    model_si = genai.GenerativeModel("gemini-1.5-flash", system_instruction="You are a goat.")
    response_si = model_si.generate_content("Who are you?")
    print("SUCCESS (System Instruction):", response_si.text)

except Exception as e:
    print("FAILED:", str(e))
