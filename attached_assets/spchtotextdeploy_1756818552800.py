from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import whisper
from datetime import datetime
from docx import Document
import soundfile as sf
import tempfile
import os
import openai
from dotenv import load_dotenv
from llm_handlers import OllamaLLMHandler

# ===== Load Environment =====
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# ===== Init FastAPI =====
app = FastAPI(title="Speech-to-Text + Grammar Correction API")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your frontend URL for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== Load Whisper (local) =====
print("Loading local Whisper model...")
local_model = whisper.load_model("small")
print("Local model loaded.\n")

# ===== Init Ollama =====
ollama_handler = OllamaLLMHandler(model_name="llama3.3")


# ===== Grammar Correction =====
def correct_grammar(text: str, lang: str, llm_choice: str):
    if not text.strip():
        return text

    lang_map = {"en": "English", "fr": "French", "es": "Spanish"}
    lang_name = lang_map.get(lang, "the original language")

    prompt = (
        f"You are a transcription corrector. "
        f"Rewrite the following text in fluent {lang_name}, fixing grammar, punctuation, and accent-related errors. "
        f"Do not explain or describe your changes. "
        f"Only return the corrected text.\n\n"
        f"Text:\n{text}\n\n"
        f"Corrected {lang_name} text:"
    )

    try:
        if llm_choice == "ollama":
            return ollama_handler.generate_response(prompt).strip()
        else:
            corrected = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt},
                ],
            ).choices[0].message.content
            return corrected.strip()
    except Exception as e:
        print(f"{llm_choice} correction failed:", e)
        return text


# ===== Process Audio =====
def process_audio(audio_data: np.ndarray, sr: int, language: str, engine: str, llm_engine: str):
    raw_text = ""

    # Convert stereo → mono
    if audio_data.ndim > 1:
        audio_data = np.mean(audio_data, axis=1)
    audio_data = audio_data.astype(np.float32)

    # Resample to 16kHz if needed
    if sr != 16000:
        import librosa
        audio_data = librosa.resample(audio_data, orig_sr=sr, target_sr=16000)

    print(f"Transcribing in {language} using {engine}...")

    if engine == "whisper_local":
        result = local_model.transcribe(audio_data, fp16=False, language=language)
        raw_text = result.get("text", "").strip()

    elif engine == "openai_stt":
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmpfile:
            sf.write(tmpfile.name, audio_data, 16000)
            tmpfile.flush()
            with open(tmpfile.name, "rb") as audio_file:
                transcription = openai.audio.transcriptions.create(
                    model="gpt-4o-mini-transcribe",
                    file=audio_file,
                    language=language,
                )
                raw_text = transcription.text.strip()

    if raw_text:
        print(f"Correcting grammar with {llm_engine}...")
        corrected_text = correct_grammar(raw_text, language, llm_engine)

        # Save DOCX
        filename = f"transcription_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
        doc = Document()
        doc.add_paragraph(corrected_text)
        doc.save(filename)

        return corrected_text, filename

    return "", None


# ===== Routes =====

@app.get("/")
async def root():
    return {"message": "Speech-to-Text + Grammar Correction API is running 🚀"}


@app.post("/upload-audio/")
async def upload_audio(
    file: UploadFile = File(...),
    language: str = Form("en"),
    engine: str = Form("whisper_local"),
    llm_engine: str = Form("ollama"),
):
    try:
        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Load audio
        audio_data, sr = sf.read(tmp_path)

        # Process
        corrected_text, docx_file = process_audio(audio_data, sr, language, engine, llm_engine)

        if not corrected_text:
            return JSONResponse(content={"error": "Transcription failed"}, status_code=400)

        return {
            "corrected_text": corrected_text,
            "docx_file": docx_file,
        }

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download generated DOCX"""
    if not os.path.exists(filename):
        return JSONResponse(content={"error": "File not found"}, status_code=404)
    return FileResponse(filename, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")


# ===== Run with: uvicorn filename:app --reload =====
