class AudioTranscriber {
    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordingTimer = null;
        this.recordingStartTime = null;
        this.init();
        this.checkStatus();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupInputMethodToggle();
    }

    setupElements() {
        this.elements = {
            uploadForm: document.getElementById('uploadForm'),
            uploadArea: document.getElementById('uploadArea'),
            browseBtn: document.getElementById('browseBtn'),
            audioFile: document.getElementById('audioFile'),
            fileInfo: document.getElementById('fileInfo'),
            fileName: document.getElementById('fileName'),
            fileSize: document.getElementById('fileSize'),
            submitBtn: document.getElementById('submitBtn'),
            progressSection: document.getElementById('progressSection'),
            progressBar: document.getElementById('progressBar'),
            progressText: document.getElementById('progressText'),
            resultsSection: document.getElementById('resultsSection'),
            rawText: document.getElementById('rawText'),
            correctedText: document.getElementById('correctedText'),
            downloadBtn: document.getElementById('downloadBtn'),
            newTranscriptionBtn: document.getElementById('newTranscriptionBtn'),
            errorSection: document.getElementById('errorSection'),
            errorMessage: document.getElementById('errorMessage'),
            retryBtn: document.getElementById('retryBtn'),
            statusIndicator: document.getElementById('status-text'),
            rawTranscription: document.getElementById('rawTranscription'),
            // Recording elements
            fileInputRadio: document.getElementById('fileInput'),
            micInputRadio: document.getElementById('micInput'),
            recordingArea: document.getElementById('recordingArea'),
            startRecording: document.getElementById('startRecording'),
            stopRecording: document.getElementById('stopRecording'),
            recordingTimer: document.getElementById('recordingTimer'),
            timerDisplay: document.getElementById('timerDisplay'),
            recordingTitle: document.getElementById('recordingTitle'),
            recordingSubtitle: document.getElementById('recordingSubtitle'),
            recordingIcon: document.getElementById('recordingIcon')
        };
    }

    setupEventListeners() {
        // Form submission
        this.elements.uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Browse button
        this.elements.browseBtn.addEventListener('click', () => {
            this.elements.audioFile.click();
        });

        // File input change
        this.elements.audioFile.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Download button
        this.elements.downloadBtn.addEventListener('click', () => {
            this.downloadFile();
        });

        // New transcription button
        this.elements.newTranscriptionBtn.addEventListener('click', () => {
            this.resetForm();
        });

        // Retry button
        this.elements.retryBtn.addEventListener('click', () => {
            this.resetForm();
        });

        // Upload area click
        this.elements.uploadArea.addEventListener('click', () => {
            this.elements.audioFile.click();
        });

        // Recording controls
        this.elements.startRecording.addEventListener('click', () => {
            this.startRecording();
        });

        this.elements.stopRecording.addEventListener('click', () => {
            this.stopRecording();
        });
    }

    setupInputMethodToggle() {
        // Input method radio buttons
        this.elements.fileInputRadio.addEventListener('change', () => {
            if (this.elements.fileInputRadio.checked) {
                this.switchToFileInput();
            }
        });

        this.elements.micInputRadio.addEventListener('change', () => {
            if (this.elements.micInputRadio.checked) {
                this.switchToMicInput();
            }
        });
    }

    switchToFileInput() {
        this.elements.uploadArea.classList.remove('d-none');
        this.elements.recordingArea.classList.add('d-none');
        this.resetRecording();
    }

    switchToMicInput() {
        this.elements.uploadArea.classList.add('d-none');
        this.elements.recordingArea.classList.remove('d-none');
        this.elements.fileInfo.classList.add('d-none');
        this.selectedFile = null;
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.recordedChunks = [];

            this.mediaRecorder.addEventListener('dataavailable', (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            });

            this.mediaRecorder.addEventListener('stop', () => {
                this.processRecording();
                stream.getTracks().forEach(track => track.stop());
            });

            this.mediaRecorder.start();
            this.startRecordingUI();

        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.showError('Could not access microphone. Please check permissions.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
        this.stopRecordingUI();
    }

    startRecordingUI() {
        this.elements.recordingArea.classList.add('recording');
        this.elements.startRecording.classList.add('d-none');
        this.elements.stopRecording.classList.remove('d-none');
        this.elements.recordingTimer.classList.remove('d-none');
        
        this.elements.recordingTitle.textContent = 'Recording...';
        this.elements.recordingSubtitle.textContent = 'Speak clearly into your microphone';
        
        // Start timer
        this.recordingStartTime = Date.now();
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            this.elements.timerDisplay.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);

        this.updateStatus('Recording', 'danger');
    }

    stopRecordingUI() {
        this.elements.recordingArea.classList.remove('recording');
        this.elements.startRecording.classList.remove('d-none');
        this.elements.stopRecording.classList.add('d-none');
        this.elements.recordingTimer.classList.add('d-none');
        
        this.elements.recordingTitle.textContent = 'Processing Recording...';
        this.elements.recordingSubtitle.textContent = 'Converting your audio for transcription';
        
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }

        this.updateStatus('Processing', 'warning');
    }

    processRecording() {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        
        // Create a file-like object from the blob
        const recordedFile = new File([blob], `recording_${Date.now()}.webm`, {
            type: 'audio/webm'
        });

        // Set the recorded file as the selected file and show info
        this.selectedFile = recordedFile;
        this.elements.fileName.textContent = recordedFile.name;
        this.elements.fileSize.textContent = this.formatFileSize(recordedFile.size);
        this.elements.fileInfo.classList.remove('d-none');
        this.elements.submitBtn.disabled = false;

        // Update UI
        this.elements.recordingTitle.textContent = 'Recording Complete';
        this.elements.recordingSubtitle.textContent = 'Ready to transcribe your audio';
        this.updateStatus('Ready', 'success');
    }

    resetRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
        
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }

        this.elements.recordingArea.classList.remove('recording');
        this.elements.startRecording.classList.remove('d-none');
        this.elements.stopRecording.classList.add('d-none');
        this.elements.recordingTimer.classList.add('d-none');
        this.elements.timerDisplay.textContent = '00:00';
        
        this.elements.recordingTitle.textContent = 'Ready to Record';
        this.elements.recordingSubtitle.textContent = 'Click start to begin recording your voice';
        
        this.recordedChunks = [];
        this.mediaRecorder = null;
    }

    setupDragAndDrop() {
        const uploadArea = this.elements.uploadArea;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('drag-over');
            }, false);
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleFileSelect(file) {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/m4a', 
                             'audio/ogg', 'audio/flac', 'audio/aac', 'audio/webm'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['.wav', '.mp3', '.m4a', '.ogg', '.flac', '.aac', '.webm'];

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            this.showError('Please select a valid audio file (WAV, MP3, M4A, OGG, FLAC, AAC, WEBM)');
            return;
        }

        // Validate file size (100MB max)
        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError('File size must be less than 100MB');
            return;
        }

        // Show file info
        this.elements.fileName.textContent = file.name;
        this.elements.fileSize.textContent = this.formatFileSize(file.size);
        this.elements.fileInfo.classList.remove('d-none');
        this.elements.submitBtn.disabled = false;

        // Store file reference
        this.selectedFile = file;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async handleSubmit() {
        if (!this.selectedFile) {
            this.showError('Please select an audio file');
            return;
        }

        this.showProgress();
        this.updateProgress(10, 'Uploading file...');

        const formData = new FormData();
        formData.append('audio_file', this.selectedFile);
        formData.append('language', document.getElementById('language').value);
        formData.append('engine', document.getElementById('engine').value);
        formData.append('llm_engine', document.getElementById('llmEngine').value);

        try {
            this.updateProgress(30, 'Processing audio...');

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            this.updateProgress(70, 'Transcribing speech...');

            const result = await response.json();

            this.updateProgress(90, 'Correcting grammar...');

            if (result.success) {
                this.updateProgress(100, 'Complete!');
                setTimeout(() => {
                    this.showResults(result);
                }, 500);
            } else {
                throw new Error(result.error || 'Unknown error occurred');
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.showError(error.message || 'Failed to process audio file');
        }
    }

    showProgress() {
        this.hideAllSections();
        this.elements.progressSection.classList.remove('d-none');
        this.elements.progressSection.classList.add('fade-in');
        this.elements.submitBtn.disabled = true;
        this.updateStatus('Processing', 'warning');
    }

    updateProgress(percent, text) {
        this.elements.progressBar.style.width = percent + '%';
        this.elements.progressText.textContent = text;
    }

    showResults(result) {
        this.hideAllSections();
        this.elements.resultsSection.classList.remove('d-none');
        this.elements.resultsSection.classList.add('fade-in');

        // Show raw transcription only if different from corrected
        if (result.raw_text && result.raw_text !== result.corrected_text) {
            this.elements.rawText.textContent = result.raw_text;
            this.elements.rawTranscription.classList.remove('d-none');
        } else {
            this.elements.rawTranscription.classList.add('d-none');
        }

        this.elements.correctedText.textContent = result.corrected_text;
        
        // Store filename for download
        this.downloadFilename = result.docx_file;
        
        this.updateStatus('Complete', 'success');
    }

    showError(message) {
        this.hideAllSections();
        this.elements.errorSection.classList.remove('d-none');
        this.elements.errorSection.classList.add('fade-in');
        this.elements.errorMessage.textContent = message;
        this.elements.submitBtn.disabled = false;
        this.updateStatus('Error', 'danger');
    }

    hideAllSections() {
        [this.elements.progressSection, this.elements.resultsSection, this.elements.errorSection]
            .forEach(section => {
                section.classList.add('d-none');
                section.classList.remove('fade-in');
            });
    }

    downloadFile() {
        if (this.downloadFilename) {
            const link = document.createElement('a');
            link.href = `/download/${this.downloadFilename}`;
            link.download = this.downloadFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    resetForm() {
        // Reset form
        this.elements.uploadForm.reset();
        this.elements.fileInfo.classList.add('d-none');
        this.elements.submitBtn.disabled = true;
        this.selectedFile = null;
        this.downloadFilename = null;

        // Reset recording
        this.resetRecording();

        // Reset to file input mode
        this.elements.fileInputRadio.checked = true;
        this.switchToFileInput();

        // Hide all sections
        this.hideAllSections();
        
        this.updateStatus('Ready', 'success');
    }

    updateStatus(text, type) {
        this.elements.statusIndicator.textContent = text;
        const icon = this.elements.statusIndicator.previousElementSibling;
        
        // Reset classes
        icon.className = 'fas fa-circle me-1';
        
        // Add appropriate class
        switch(type) {
            case 'success':
                icon.classList.add('text-success');
                break;
            case 'warning':
                icon.classList.add('text-warning');
                break;
            case 'danger':
                icon.classList.add('text-danger');
                break;
            default:
                icon.classList.add('text-success');
        }
    }

    async checkStatus() {
        try {
            const response = await fetch('/status');
            const status = await response.json();
            
            console.log('System status:', status);
            
            if (!status.whisper_available && !status.openai_available) {
                this.showError('No speech-to-text engines are available. Please check your configuration.');
            }
        } catch (error) {
            console.warn('Could not check system status:', error);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AudioTranscriber();
});

// Add some visual enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add CSS for ripple effect
    if (!document.getElementById('ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = `
            .btn {
                position: relative;
                overflow: hidden;
            }
            .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: ripple-animation 0.6s linear;
                pointer-events: none;
            }
            @keyframes ripple-animation {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
});
