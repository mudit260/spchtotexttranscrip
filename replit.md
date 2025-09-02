# Speech-to-Text Transcription Service

## Overview

A professional web application that provides speech-to-text transcription services with grammar correction capabilities. The application accepts audio files in various formats, transcribes them using local Whisper models, and optionally corrects grammar using either OpenAI's API or local Ollama LLM models. Users can download transcriptions as formatted Word documents.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology**: HTML5, CSS3, JavaScript (vanilla)
- **UI Framework**: Bootstrap 5.3.0 for responsive design
- **Design Pattern**: Single-page application with progressive enhancement
- **Key Features**: Drag-and-drop file upload, real-time progress tracking, status indicators
- **Styling**: Custom CSS with audio-themed gradients and modern card-based layout

### Backend Architecture
- **Framework**: Flask web framework with Python
- **Application Structure**: Modular design separating core app logic from LLM handlers
- **File Handling**: Secure file upload with extension validation and size limits (100MB max)
- **Audio Processing**: Local Whisper model integration for speech-to-text conversion
- **Document Generation**: Microsoft Word document creation using python-docx

### Data Storage Solutions
- **File Storage**: Local filesystem with organized directory structure
  - `uploads/` - Temporary audio file storage
  - `transcriptions/` - Generated transcription documents
- **Session Management**: Flask sessions with configurable secret keys
- **No Database**: Stateless application design with file-based persistence

### Audio Processing Pipeline
- **Transcription Engine**: OpenAI Whisper (small model) for local processing
- **Supported Formats**: WAV, MP3, M4A, OGG, FLAC, AAC
- **Processing Flow**: File upload → Format validation → Whisper transcription → Grammar correction → Document generation

### LLM Integration Architecture
- **Primary Handler**: Custom OllamaLLMHandler class for local LLM processing
- **Fallback Option**: OpenAI API integration for cloud-based processing
- **Model Configuration**: Configurable temperature and top_p parameters
- **Error Handling**: Comprehensive exception handling with fallback mechanisms

### Security and Validation
- **File Security**: Werkzeug secure filename handling
- **Upload Limits**: File size restrictions and extension whitelist
- **Proxy Support**: ProxyFix middleware for reverse proxy deployments
- **Environment Configuration**: Environment variables for sensitive data

## External Dependencies

### Core Processing Libraries
- **OpenAI Whisper**: Local speech-to-text processing
- **SoundFile**: Audio file format handling and conversion
- **NumPy**: Numerical processing for audio data

### LLM Services
- **Ollama**: Local LLM service (default: llama3.3 model)
  - Base URL: http://localhost:11434
  - API endpoint: /api/generate
  - Timeout: 120 seconds
- **OpenAI API**: Cloud-based grammar correction service
  - Requires OPENAI_API_KEY environment variable

### Web Framework Dependencies
- **Flask**: Core web framework
- **Werkzeug**: WSGI utilities and security features
- **Jinja2**: Template rendering (implied by Flask)

### Document Processing
- **python-docx**: Microsoft Word document generation
- **File format support**: DOCX export with formatted transcriptions

### Development and Configuration
- **python-dotenv**: Environment variable management
- **Requests**: HTTP client for Ollama API communication

### Frontend Libraries (CDN)
- **Bootstrap 5.3.0**: UI framework and responsive design
- **Font Awesome 6.4.0**: Icon library for enhanced UX