#!/usr/bin/env python3
"""
Script to generate BAML client code
"""
import subprocess
import sys
import os

def generate_baml_client():
    """Generate BAML client code"""
    try:
        # Try to generate using baml_py
        from baml_py import Generator
        
        generator = Generator()
        generator.generate("./baml_src", "./")
        print("BAML client generated successfully!")
        
    except ImportError:
        print("baml_py not available, creating minimal client manually...")
        create_minimal_client()

def create_minimal_client():
    """Create a minimal BAML client manually"""
    
    # Create baml_client directory
    os.makedirs("baml_client", exist_ok=True)
    
    # Create __init__.py
    with open("baml_client/__init__.py", "w") as f:
        f.write("""# BAML Client
from .client import b
from .types import FocusAnalysisResult

__all__ = ['b', 'FocusAnalysisResult']
""")
    
    # Create types.py
    with open("baml_client/types.py", "w") as f:
        f.write("""# BAML Generated Types
from pydantic import BaseModel
from typing import Optional

class FocusAnalysisResult(BaseModel):
    negative_stimulus: bool
    analysis: str
    confidence: float
    distraction_details: Optional[str] = None
""")
    
    # Create client.py
    with open("baml_client/client.py", "w") as f:
        f.write("""# BAML Generated Client
import os
import json
import requests
from typing import Optional
from baml_py import Image
from .types import FocusAnalysisResult

class BamlClient:
    def __init__(self):
        self.gemini_api_key = os.environ.get('GEMINI_API_KEY')
        if not self.gemini_api_key:
            print("Warning: GEMINI_API_KEY not set. Focus analysis will use mock responses.")
    
    async def AnalyzeFocus(self, screenshot: Image, focus_description: str) -> FocusAnalysisResult:
        \"\"\"
        Analyze focus using Gemini AI
        \"\"\"
        if not self.gemini_api_key:
            return self._mock_analysis(focus_description)
        
        try:
            # Convert image to base64 if needed
            if hasattr(screenshot, 'base64'):
                image_data = screenshot.base64
            else:
                image_data = str(screenshot)
            
            # Call Gemini API
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={self.gemini_api_key}"
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            prompt = f\"\"\"
You are a focus monitoring AI for Screenshock.me. Your job is to determine if a user has strayed from their stated focus goals based on a screenshot of their current activity.

USER'S FOCUS GOALS:
{focus_description}

ANALYSIS GUIDELINES:
1. Be VERY SPECIFIC and STRICT about when to trigger negative stimulus
2. Only return negative_stimulus=true when the user is ACTIVELY doing something they specifically said they want to avoid
3. Be LENIENT about activities that support their focus goals (research, reference materials, etc.)
4. DO NOT trigger for mere presence of icons, bookmarks, or URLs - only active engagement

EXAMPLES OF WHEN TO TRIGGER:
- User said "stay off Reddit" and they are actively browsing Reddit posts/comments
- User said "avoid YouTube" and they are watching a YouTube video
- User said "no social media" and they are scrolling through Twitter/Instagram feeds
- User said "stop gaming" and they are actively playing a game

EXAMPLES OF WHEN NOT TO TRIGGER:
- User said "stay off Reddit" but you only see a Reddit bookmark or icon
- User said "focus on writing" and they're researching on Wikipedia (this supports writing)
- User said "avoid YouTube" but they're watching an educational video related to their focus task
- User has multiple tabs open but is actively working on their focus task
- Brief glimpses of distracting content while navigating to focus-related content

BE CONSERVATIVE: When in doubt, DO NOT trigger negative stimulus. It's better to miss a distraction than to incorrectly punish someone who is focused.

Return your response as JSON with this exact format:
{{
  "negative_stimulus": boolean,
  "analysis": "string describing what you see",
  "confidence": number between 0.0 and 1.0,
  "distraction_details": "string if distracted, null otherwise"
}}
\"\"\"
            
            data = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/png",
                                "data": image_data
                            }
                        }
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.1,
                    "candidateCount": 1,
                    "maxOutputTokens": 1000,
                }
            }
            
            response = requests.post(url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if 'candidates' in result and result['candidates']:
                text_response = result['candidates'][0]['content']['parts'][0]['text']
                
                # Try to parse JSON from response
                try:
                    # Extract JSON from response
                    import re
                    json_match = re.search(r'\\{.*\\}', text_response, re.DOTALL)
                    if json_match:
                        json_str = json_match.group()
                        analysis_data = json.loads(json_str)
                        return FocusAnalysisResult(**analysis_data)
                except:
                    pass
                
                # Fallback parsing
                return self._parse_text_response(text_response, focus_description)
            
            return self._mock_analysis(focus_description)
            
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self._mock_analysis(focus_description)
    
    def _mock_analysis(self, focus_description: str) -> FocusAnalysisResult:
        \"\"\"Mock analysis for testing\"\"\"
        import random
        return FocusAnalysisResult(
            negative_stimulus=random.random() < 0.1,  # 10% chance of being "distracted"
            analysis="Mock analysis - using mock response due to missing API key or error",
            confidence=0.5,
            distraction_details=None
        )
    
    def _parse_text_response(self, text: str, focus_description: str) -> FocusAnalysisResult:
        \"\"\"Parse text response from Gemini\"\"\"
        # Simple keyword-based parsing as fallback
        text_lower = text.lower()
        
        negative_stimulus = any(word in text_lower for word in [
            'distracted', 'off-task', 'negative stimulus', 'trigger', 'avoid'
        ])
        
        return FocusAnalysisResult(
            negative_stimulus=negative_stimulus,
            analysis=text[:500],  # Truncate long responses
            confidence=0.7,
            distraction_details="Parsed from text response" if negative_stimulus else None
        )

# Global client instance
b = BamlClient()
""")
    
    print("Minimal BAML client created successfully!")

if __name__ == "__main__":
    generate_baml_client()