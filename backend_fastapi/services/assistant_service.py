import os
import google.generativeai as genai

class AssistantService:
    def __init__(self):
        self._configured = False
        # Highest capacity models for this API key
        self.preferred_models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]

    def _configure(self):
        if self._configured: return
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self._configured = True

    def get_response(self, query: str, context: dict, chat_history: list = [], lang: str = 'EN') -> str:
        self._configure()
        
        crop = context.get('selected_crop', 'unknown crop')
        location = context.get('location', 'Thailand')
        language_name = 'English' if lang == 'EN' else 'Thai'

        # Expert System Instruction
        system_msg = f"""
        ROLES: Chief Agronomist, Master Farmer, & Agricultural Consultant.
        CONTEXT: Farmer in {location} growing {crop}.
        MISSION: Answer ANY farming, agriculture, crop care, market, or fertilizer-related questions the farmer asks. Provide professional, actionable, and accurate solutions.
        STYLE: Technical yet easy to understand.
        FORMATTING RULE: You MUST return your answer strictly as a JSON object, with absolutely no markdown wrapping like ```json.
        The JSON must exactly match this schema:
        {{
            "response": "Detailed, multi-paragraph answer containing all specific facts, instructions, and in-depth details. No markdown asterisks.",
            "spoken_summary": "A very short, 1 or 2 sentence summary of the response that is conversational and friendly, meant to be read aloud by TTS. Avoid reading lists."
        }}
        LANGUAGE: Write BOTH fields ONLY in {language_name}.
        """

        history = []
        for entry in chat_history[-6:]:
            u = entry.get('user'); b = entry.get('bot')
            if u and b:
                history.append({"role": "user", "parts": [u]})
                history.append({"role": "model", "parts": [b]})

        if not history:
            history = [{"role": "user", "parts": [system_msg]}, {"role": "model", "parts": ["Acknowledged. I am your AgriCare Senior Agronomist. How may I assist you with your crop health?"]}]

        for model_name in self.preferred_models:
            try:
                model = genai.GenerativeModel(model_name=model_name)
                chat = model.start_chat(history=history)
                response = chat.send_message(query)
                import json
                try:
                    text = response.text.replace('```json', '').replace('```', '').strip()
                    parsed = json.loads(text)
                    return parsed.get('response', text).replace('*', ''), parsed.get('spoken_summary', text).replace('*', '')
                except:
                    return response.text.replace('*', '').strip(), "Here is the response. Please refer to the text on screen."
            except Exception as e:
                print(f"Model {model_name} failed: {e}")
                continue

        # ENHANCED EXPERT FALLBACK (If API Quota is Exceeded)
        if lang == 'EN':
            q_low = query.lower()
            if "yellow" in q_low or "spot" in q_low:
                return "Based on the yellowing and spots on your crop, I recommend checking for Nitrogen deficiency or Early Blight. Consider applying a balanced N-P-K (20-20-20) fertilizer and ensuring there is no standing water around the roots. If the spots have a yellow halo, apply a Copper-based fungicide to prevent spreading.", "I recommend checking for nitrogen deficiency or blight. Please refer to the detailed steps on screen."
            if "weed" in q_low:
                return "Aggressive weeds in your crop field compete for crucial nutrients. I recommend immediate manual weeding for small areas. For larger infestations, identify if they are broad-leaf or grassy weeds; a selective post-emergence herbicide like Glyphosate (used carefully) or an organic pelargonic acid solution is recommended.", "I recommend immediate weeding. See the text on screen for herbicide details."
            return "Our Expert AI is currently processing high data volumes, but here is my agronomic advice: Maintain consistent irrigation schedules and monitor the underside of leaves for early-stage pests. What specific symptoms are you seeing?", "I am experiencing high volumes right now, please check my advice on the screen."
        else:
            q_low = query.lower()
            if "เหลือง" in q_low or "จุด" in q_low:
                return "สำหรับอาการใบเหลืองและจุดแนะนำให้ตรวจสอบการขาดธาตุไนโตรเจนหรือโรคใบจุดค่ะ ควรให้ปุ๋ยสูตรเสมอและคุมความชื้นในดิน ถ้าจุดลามเร็วอาจต้องใช้ยาฆ่าเชื้อราค่ะ", "ขอแนะนำให้ตรวจสอบธาตุอาหารและเชื้อราค่ะ โปรดอ่านรายละเอียดบนหน้าจอ"
            return "ขณะนี้ AI ผู้เชี่ยวชาญกำลังรับรองผู้ใช้จำนวนมาก คำแนะนำเบื้องต้น: ควรรักษาความชื้นให้คงที่และตรวจหาแมลงใต้ใบค่ะ อาการที่คุณพบเป็นอย่างไรคะ?", "ขออภัยระบบคนใช้เยอะมาก กรุณาอ่านคำแนะนำเบื้องต้นบนหน้าจอค่ะ"

assistant_service = AssistantService()
