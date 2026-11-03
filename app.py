import os
import json
import base64
import tempfile
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Body, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

# Load environment variables from .env
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip("'\""))

from sarvamai import SarvamAI

api_key = os.environ.get("SARVAM_API_KEY", "")
client = SarvamAI(api_subscription_key=api_key) if api_key else None

app = FastAPI(title="Sarvam AI Avatar Tutor - Showcase Edition", description="Enterprise-grade Multilingual AI Avatar Tutor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_SPEAKERS = [
    'aditya', 'ritu', 'ashutosh', 'priya', 'neha', 'rahul', 'pooja', 
    'rohan', 'simran', 'kavya', 'amit', 'dev', 'ishita', 'shreya', 
    'ratan', 'varun', 'manan', 'sumit', 'roopa', 'kabir', 'aayan', 
    'shubh', 'advait', 'anand', 'tanya', 'tarun', 'sunny', 'mani', 
    'gokul', 'vijay', 'shruti', 'suhani', 'mohit', 'kavitha', 'rehan', 
    'soham', 'rupali'
]

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    language: str = "en-IN"
    speaker: str = "aditya"
    topic: str = "General"
    current_mastery: int = 15
    study_context: Optional[str] = ""
    history: List[ChatMessage] = []

class TTSRequest(BaseModel):
    text: str
    language_code: str = "en-IN"
    speaker: str = "aditya"
    model: str = "bulbul:v3"

class STTRequest(BaseModel):
    audio_base64: str
    language_code: str = "en-IN"
    mime_type: Optional[str] = "audio/webm"

class IngestNotesRequest(BaseModel):
    notes: str
    topic: str

TUTOR_SYSTEM_PROMPT = """You are "Guru AI", an inspiring, elite Socratic AI Avatar Tutor powered by Sarvam AI.
You explain challenging academic & STEM concepts with utmost pedagogical brilliance, natural conversational tone, visual diagrams, and adaptive comprehension checks.

When the student asks something, answer STRICTLY in valid JSON with these EXACT keys:
{
  "spoken_explanation": "Conversational, vivid spoken explanation (2-3 sentences max) tailored for text-to-speech audio delivery. Speak with enthusiasm. No asterisks, markdown, or math formulas in this spoken text.",
  "whiteboard": {
    "title": "Concise concept title",
    "type": "diagram", // "diagram" (valid Mermaid.js flowchart/mindmap), "formula" (valid KaTeX LaTeX math string), or "steps" (step-by-step breakdown)
    "content": "Valid Mermaid code (e.g. 'flowchart TD\\n  A[Sunlight] --> B[Chloroplast]\\n  B --> C[ATP + NADPH]') OR LaTeX equation (e.g. 'E = mc^2') OR numbered steps."
  },
  "key_takeaways": [
    "First core principle or takeaway",
    "Second key insight or practical connection",
    "Third intuition anchor"
  ],
  "adaptive_question": "A focused question testing whether the student grasped the concept.",
  "options": ["Option A", "Option B", "Option C"], // 3 distinct multiple-choice options, or empty list if open-ended
  "correct_option_index": 0, // 0, 1, or 2, or null if open-ended
  "feedback": "A concise encouraging explanation of why the correct answer holds.",
  "mastery_score": 30, // Updated score from 0 to 100 reflecting current student mastery
  "avatar_mood": "explaining" // One of: "explaining", "celebrating", "thinking", "curious"
}

Important Rules:
1. Mermaid diagram syntax must be clean and syntactically valid with NO markdown fences inside the string.
2. For LaTeX formulas, provide pure LaTeX expressions without $ or $$.
3. Output STRICT JSON only.
"""

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    if not client:
        raise HTTPException(status_code=500, detail="SARVAM_API_KEY is not configured.")

    messages = [{"role": "system", "content": TUTOR_SYSTEM_PROMPT}]
    
    if req.study_context:
        messages.append({
            "role": "system",
            "content": f"Student uploaded study notes context:\n{req.study_context[:2000]}"
        })

    for msg in req.history[-6:]:
        messages.append({"role": msg.role, "content": msg.content})

    user_prompt = (
        f"Topic: {req.topic}\n"
        f"Language requested: {req.language}\n"
        f"Current Mastery Level: {req.current_mastery}%\n"
        f"Student question or response: {req.message}"
    )
    messages.append({"role": "user", "content": user_prompt})

    try:
        completion = client.chat.completions(
            model="sarvam-105b-conversations",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.6,
        )
        content_text = completion.choices[0].message.content
        try:
            data = json.loads(content_text)
        except Exception:
            clean_text = content_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            data = json.loads(clean_text.strip())

    except Exception as e:
        print(f"Chat completion error: {e}")
        data = {
            "spoken_explanation": f"I heard you! Let's explore {req.topic}. Let's break this down step-by-step together.",
            "whiteboard": {
                "title": f"Exploring {req.topic}",
                "type": "diagram",
                "content": f"flowchart TD\n  Start[{req.topic}] --> Concept[Core Principle]\n  Concept --> Practical[Real-World Application]"
            },
            "key_takeaways": [
                f"Core foundations of {req.topic}",
                "Practical real-world applications",
                "Key intuition for exam mastery"
            ],
            "adaptive_question": "What aspect of this topic would you like to unpack first?",
            "options": ["Fundamental Principles", "Real-world Examples", "Step-by-step Quiz"],
            "correct_option_index": None,
            "feedback": "Great curiosity! Asking questions is the first step of mastery.",
            "mastery_score": min(req.current_mastery + 10, 100),
            "avatar_mood": "explaining"
        }

    # Synthesize audio with Sarvam Bulbul v3 TTS
    audio_base64 = None
    try:
        valid_speaker = req.speaker if req.speaker in VALID_SPEAKERS else 'aditya'
        target_lang = req.language if req.language in ["hi-IN", "ta-IN", "te-IN", "kn-IN", "mr-IN", "bn-IN", "gu-IN", "pa-IN", "od-IN"] else "en-IN"
        
        clean_speech = data.get("spoken_explanation", "Hello!")
        clean_speech = clean_speech.replace("*", "").replace("#", "").replace("`", "")

        tts_res = client.text_to_speech.convert(
            text=clean_speech,
            language_code=target_lang,
            speaker=valid_speaker,
            model="bulbul:v3",
            output_audio_codec="mp3"
        )
        if tts_res and hasattr(tts_res, "audios") and tts_res.audios:
            audio_base64 = tts_res.audios[0]
    except Exception as tts_err:
        print(f"TTS Synthesis error: {tts_err}")

    data["audio_base64"] = audio_base64
    return JSONResponse(content=data)

@app.post("/api/tts")
async def tts_endpoint(req: TTSRequest):
    if not client:
        raise HTTPException(status_code=500, detail="SARVAM_API_KEY is not configured.")
    try:
        valid_speaker = req.speaker if req.speaker in VALID_SPEAKERS else 'aditya'
        tts_res = client.text_to_speech.convert(
            text=req.text,
            language_code=req.language_code,
            speaker=valid_speaker,
            model="bulbul:v3",
            output_audio_codec="mp3"
        )
        if tts_res and hasattr(tts_res, "audios") and tts_res.audios:
            return {"audio_base64": tts_res.audios[0]}
        raise HTTPException(status_code=500, detail="No audio returned from Sarvam TTS")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/test-voice")
async def test_voice(speaker: str = "aditya", language_code: str = "en-IN"):
    if not client:
        raise HTTPException(status_code=500, detail="SARVAM_API_KEY is not configured.")
    try:
        valid_speaker = speaker if speaker in VALID_SPEAKERS else 'aditya'
        tts_res = client.text_to_speech.convert(
            text="Namaste! I am Guru AI, your personal Sarvam tutor. My voice is crystal clear and ready to teach!",
            language_code=language_code if language_code in ["hi-IN", "ta-IN", "te-IN", "kn-IN", "mr-IN", "bn-IN", "gu-IN", "pa-IN", "od-IN"] else "en-IN",
            speaker=valid_speaker,
            model="bulbul:v3",
            output_audio_codec="mp3"
        )
        if tts_res and hasattr(tts_res, "audios") and tts_res.audios:
            return {"audio_base64": tts_res.audios[0]}
        raise HTTPException(status_code=500, detail="Failed to synthesize test voice")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stt")
async def stt_endpoint(req: STTRequest):
    if not client:
        raise HTTPException(status_code=500, detail="SARVAM_API_KEY is not configured.")
    try:
        raw_bytes = base64.b64decode(req.audio_base64)
        ext = ".webm"
        mime = req.mime_type or "audio/webm"
        if "wav" in mime:
            ext = ".wav"
        elif "mp4" in mime or "m4a" in mime:
            ext = ".mp4"
        elif "ogg" in mime:
            ext = ".ogg"

        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(raw_bytes)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as f:
                stt_res = client.speech_to_text.transcribe(
                    file=f,
                    model="saaras:v3",
                    language_code=req.language_code
                )
            transcript = getattr(stt_res, "transcript", "")
            return {"transcript": transcript, "success": True}
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as e:
        print(f"STT Error: {e}")
        return {"transcript": "", "success": False, "error": str(e)}

@app.post("/api/summary")
async def generate_summary(history: List[ChatMessage]):
    if not client:
        raise HTTPException(status_code=500, detail="SARVAM_API_KEY is not configured.")
    
    prompt = "Review this tutoring lesson dialogue and generate a concise, beautiful Markdown Revision Sheet with 1) Key Concepts Mastered, 2) Core Formulas / Laws, and 3) Next Steps for Practice:\n\n"
    for msg in history[-10:]:
        prompt += f"{msg.role.upper()}: {msg.content}\n"

    try:
        completion = client.chat.completions(
            model="sarvam-105b-conversations",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
        )
        return {"summary": completion.choices[0].message.content}
    except Exception as e:
        return {"summary": "### Lesson Summary\n- Solid interactive dialogue completed.\n- Review core principles on the whiteboard."}

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "has_api_key": bool(api_key),
        "sarvam_models": {
            "llm": "sarvam-105b-conversations",
            "tts": "bulbul:v3 (EdTech voices: aditya, simran, shubh, ritu, priya, rohan)",
            "stt": "saaras:v3"
        }
    }

# Mount static directory for frontend
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def root():
    index_file = os.path.join(static_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "AI Avatar Tutor Server Running. Please place index.html in static/"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
