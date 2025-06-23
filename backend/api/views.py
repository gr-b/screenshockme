import json
import base64
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import os
import sys

# Add the current directory to Python path for BAML imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

try:
    from baml_client import b
    from baml_py import Image
    BAML_AVAILABLE = True
except ImportError:
    BAML_AVAILABLE = False
    print("BAML client not available, using mock responses")

@csrf_exempt
@require_http_methods(["POST"])
async def monitor_screen(request):
    try:
        data = json.loads(request.body)
        base64_image = data.get('base64_encoded_image')
        focus_description = data.get('focus_description')
        pavlok_token = data.get('pavlok_token')
        
        if not base64_image or not focus_description:
            return JsonResponse({
                'error': 'Missing required fields: base64_encoded_image and focus_description'
            }, status=400)
        
        # Use BAML to analyze focus
        if BAML_AVAILABLE:
            analysis_result = await analyze_focus_with_baml(base64_image, focus_description)
        else:
            analysis_result = analyze_focus_mock(base64_image, focus_description)
        
        # If negative stimulus is triggered and Pavlok token is provided
        if analysis_result.get('negative_stimulus') and pavlok_token:
            stimulus_type = get_stimulus_type_from_description(focus_description)
            send_pavlok_stimulus(pavlok_token, stimulus_type)
        
        return JsonResponse(analysis_result)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def analyze_focus_mock(base64_image, focus_description):
    """
    Mock function that will be replaced with BAML + Gemini integration
    """
    # For testing, randomly decide if user is distracted
    import random
    is_distracted = random.random() < 0.1  # 10% chance of being "distracted"
    
    return {
        'negative_stimulus': is_distracted,
        'analysis': 'Mock analysis - user appears to be focused' if not is_distracted else 'Mock analysis - user appears distracted',
        'confidence': 0.85,
        'timestamp': '2024-01-01T00:00:00Z'
    }

def get_stimulus_type_from_description(focus_description):
    """
    Extract stimulus type from focus description
    This is a simplified version - in reality this would come from the frontend
    """
    return 'zap'  # Default to zap for now

async def analyze_focus_with_baml(base64_image, focus_description):
    """
    Use BAML to analyze focus with Gemini
    """
    try:
        # Create Image object from base64
        image = Image.from_base64("image/png", base64_image)
        
        # Call BAML function
        result = await b.AnalyzeFocus(image, focus_description)
        
        return {
            'negative_stimulus': result.negative_stimulus,
            'analysis': result.analysis,
            'confidence': result.confidence,
            'distraction_details': result.distraction_details,
            'timestamp': '2024-01-01T00:00:00Z'  # Current timestamp would be better
        }
        
    except Exception as e:
        print(f"BAML analysis error: {e}")
        return analyze_focus_mock(base64_image, focus_description)

def send_pavlok_stimulus(pavlok_token, stimulus_type='zap', intensity=50):
    """
    Send stimulus to Pavlok device
    """
    try:
        url = 'https://api.pavlok.com/api/v5/stimulus/send'
        headers = {
            'Authorization': f'Bearer {pavlok_token}',
            'accept': 'application/json',
            'content-type': 'application/json'
        }
        
        # Map stimulus types
        stimulus_map = {
            'zap': 'zap',
            'beep': 'beep', 
            'vibrate': 'vibe'
        }
        
        data = {
            'stimulus': {
                'stimulusType': stimulus_map.get(stimulus_type, 'zap'),
                'stimulusValue': intensity
            }
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=10)
        response.raise_for_status()
        
        return {'success': True, 'pavlok_response': response.json()}
        
    except requests.exceptions.RequestException as e:
        print(f"Pavlok API error: {e}")
        return {'success': False, 'error': str(e)}