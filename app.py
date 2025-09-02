import os
import logging
import tempfile
import numpy as np
import whisper
import soundfile as sf
import openai
from datetime import datetime
from docx import Document
from flask import Flask, render_template, request, jsonify, send_file, flash, redirect, url_for
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
from dotenv import load_dotenv
from llm_handlers import OllamaLLMHandler
from pydub import AudioSegment

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
UPLOAD_FOLDER = 'uploads'
TRANSCRIPTION_FOLDER = 'transcriptions'
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'm4a', 'ogg', 'flac', 'aac', 'webm'}

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TRANSCRIPTION_FOLDER, exist_ok=True)

# Initialize OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Whisper model
print("Loading local Whisper model...")
local_model = None
try:
    import openai
    # Use OpenAI's Whisper API instead of local model for better compatibility
    print("Using OpenAI Whisper API for transcription")
    local_model = "whisper-api"  # Flag to indicate we're using API
except Exception as e:
    print(f"Whisper configuration: {e}")

# Initialize Ollama handler
ollama_handler = None
try:
    ollama_handler = OllamaLLMHandler(model_name="llama3.3")
    print("Ollama handler initialized successfully")
except Exception as e:
    print(f"Failed to initialize Ollama handler: {e}")

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def correct_grammar(text: str, lang: str, llm_choice: str):
    """Correct grammar using selected LLM"""
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
        if llm_choice == "ollama" and ollama_handler:
            return ollama_handler.generate_response(prompt).strip()
        elif llm_choice == "openai":
            # the newest OpenAI model is "gpt-5" which was released August 7, 2025.
            # do not change this unless explicitly requested by the user
            response = openai.chat.completions.create(
                model="gpt-5",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt},
                ],
                timeout=30
            )
            return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"{llm_choice} correction failed:", e)
        return text

    return text

def convert_webm_to_wav(webm_path: str) -> str:
    """Convert WebM audio to WAV format"""
    try:
        # Load WebM audio
        audio = AudioSegment.from_file(webm_path, format="webm")
        
        # Convert to WAV
        wav_path = webm_path.replace('.webm', '.wav')
        audio.export(wav_path, format="wav", parameters=["-acodec", "pcm_s16le", "-ar", "16000"])
        
        return wav_path
    except Exception as e:
        raise Exception(f"Failed to convert WebM to WAV: {e}")

def process_audio(audio_path: str, language: str, engine: str, llm_engine: str):
    """Process audio file for transcription and grammar correction"""
    try:
        # Convert WebM to WAV if needed
        if audio_path.lower().endswith('.webm'):
            audio_path = convert_webm_to_wav(audio_path)
        
        # Load audio file
        audio_data, sr = sf.read(audio_path)
        
        # Convert stereo to mono
        if audio_data.ndim > 1:
            audio_data = np.mean(audio_data, axis=1)
        audio_data = audio_data.astype(np.float32)

        # Resample to 16kHz if needed (simplified approach)
        if sr != 16000:
            # Basic resampling - for production use librosa or scipy
            ratio = 16000 / sr
            new_length = int(len(audio_data) * ratio)
            audio_data = np.interp(np.linspace(0, len(audio_data)-1, new_length), 
                                 np.arange(len(audio_data)), audio_data)

        raw_text = ""
        
        # Transcribe using selected engine
        if engine == "whisper_local" and local_model:
            # Use OpenAI Whisper API since local model isn't available
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmpfile:
                sf.write(tmpfile.name, audio_data, 16000)
                tmpfile.flush()
                
                with open(tmpfile.name, "rb") as audio_file:
                    transcription = openai.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language=language,
                        timeout=60
                    )
                    raw_text = transcription.text.strip()
                
                # Clean up temp file
                os.unlink(tmpfile.name)
        elif engine == "openai_stt":
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmpfile:
                sf.write(tmpfile.name, audio_data, 16000)
                tmpfile.flush()
                
                with open(tmpfile.name, "rb") as audio_file:
                    transcription = openai.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language=language,
                        timeout=60
                    )
                    raw_text = transcription.text.strip()
                
                # Clean up temp file
                os.unlink(tmpfile.name)

        if raw_text:
            # Correct grammar
            corrected_text = correct_grammar(raw_text, language, llm_engine)
            
            # Generate DOCX file
            filename = f"transcription_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
            filepath = os.path.join(TRANSCRIPTION_FOLDER, filename)
            
            doc = Document()
            doc.add_paragraph(corrected_text)
            doc.save(filepath)
            
            return {
                "success": True,
                "raw_text": raw_text,
                "corrected_text": corrected_text,
                "docx_file": filename,
                "docx_path": filepath
            }
        else:
            return {"success": False, "error": "No text was transcribed"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_audio():
    """Handle audio file upload and processing"""
    try:
        # Check if file was uploaded
        if 'audio_file' not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"}), 400
        
        file = request.files['audio_file']
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"success": False, "error": "File type not allowed"}), 400
        
        # Get form parameters
        language = request.form.get('language', 'en')
        engine = request.form.get('engine', 'whisper_local')
        llm_engine = request.form.get('llm_engine', 'ollama')
        
        # Save uploaded file
        filename = secure_filename(file.filename or "audio_file")
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Process the audio
        result = process_audio(filepath, language, engine, llm_engine)
        
        # Clean up uploaded file and any converted files
        try:
            os.remove(filepath)
            # Also clean up any converted WAV file if original was WebM
            if filepath.lower().endswith('.webm'):
                wav_path = filepath.replace('.webm', '.wav')
                if os.path.exists(wav_path):
                    os.remove(wav_path)
        except:
            pass
        
        return jsonify(result)
        
    except Exception as e:
        logging.error(f"Upload error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/download/<filename>')
def download_file(filename):
    """Download generated DOCX file"""
    try:
        filepath = os.path.join(TRANSCRIPTION_FOLDER, filename)
        if not os.path.exists(filepath):
            return jsonify({"error": "File not found"}), 404
        
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/status')
def status():
    """API status endpoint"""
    return jsonify({
        "status": "running",
        "whisper_available": local_model is not None,
        "ollama_available": ollama_handler is not None,
        "openai_available": bool(openai.api_key)
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
