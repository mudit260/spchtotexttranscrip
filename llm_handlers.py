import requests
import json
from typing import Optional

class OllamaLLMHandler:
    """Handler for Ollama local LLM"""
    
    def __init__(self, model_name: str = "llama3.3", base_url: str = "http://localhost:11434"):
        self.model_name = model_name
        self.base_url = base_url
        self.api_url = f"{base_url}/api/generate"
    
    def generate_response(self, prompt: str) -> str:
        """Generate response using Ollama"""
        try:
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            }
            
            response = requests.post(
                self.api_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "")
            else:
                raise Exception(f"Ollama API error: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            raise Exception("Could not connect to Ollama. Make sure Ollama is running.")
        except requests.exceptions.Timeout:
            raise Exception("Ollama request timed out.")
        except Exception as e:
            raise Exception(f"Ollama error: {str(e)}")
    
    def is_available(self) -> bool:
        """Check if Ollama is available"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except:
            return False
