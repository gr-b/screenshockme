import json
import base64
import requests
import httpx
import logging
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import os
import sys

# Get logger for this module
logger = logging.getLogger(__name__)

# Add the current directory to Python path for BAML imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from baml_client import b
from baml_py import Image
logger.info("BAML client loaded successfully")

@csrf_exempt
@require_http_methods(["POST"])
async def monitor_screen(request):
    start_time = time.time()
    client_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown'))
    
    logger.info(f"Screen monitoring request from {client_ip}")
    
    try:
        data = json.loads(request.body)
        base64_image = data.get('base64_encoded_image')
        focus_description = data.get('focus_description')
        pavlok_token = data.get('pavlok_token')
        stimulus_type = data.get('stimulus_type', 'beep-laptop')
        
        logger.debug(f"Request data: focus_description='{focus_description}', has_image={bool(base64_image)}, has_pavlok_token={bool(pavlok_token)}")
        
        if not base64_image or not focus_description:
            logger.warning(f"Missing required fields from {client_ip}")
            return JsonResponse({
                'error': 'Missing required fields: base64_encoded_image and focus_description'
            }, status=400)
        
        # Use BAML to analyze focus
        logger.debug("Using BAML for focus analysis")
        analysis_result = await analyze_focus_with_baml(base64_image, focus_description)
        
        logger.info(f"Analysis result: negative_stimulus={analysis_result.get('negative_stimulus')}")
        
        # If negative stimulus is triggered, handle stimulus based on type
        if analysis_result.get('negative_stimulus'):
            if stimulus_type in ['pavlok_zap', 'pavlok_beep', 'pavlok_vibe'] and pavlok_token:
                logger.info(f"Sending Pavlok stimulus: {stimulus_type}")
                # Map frontend stimulus types to Pavlok API types
                pavlok_type = stimulus_type.replace('pavlok_', '')
                if pavlok_type == 'vibe':
                    pavlok_type = 'vibrate'
                stimulus_result = await send_pavlok_stimulus(pavlok_token, pavlok_type)
                logger.info(f"Pavlok stimulus result: {stimulus_result.get('success', False)}")
            elif stimulus_type == 'beep-laptop':
                logger.info("Laptop beep stimulus requested - handled by frontend")
            else:
                logger.warning(f"Unknown stimulus type: {stimulus_type}")
        
        processing_time = time.time() - start_time
        logger.info(f"Request completed in {processing_time:.3f}s for {client_ip}")
        
        return JsonResponse(analysis_result)
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error from {client_ip}: {str(e)}")
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Unexpected error from {client_ip} after {processing_time:.3f}s: {str(e)}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


def _analyze_focus_sync(base64_image, focus_description):
    """
    Synchronous BAML analysis function to run in thread pool
    """
    try:
        logger.debug("Starting BAML analysis")
        start_time = time.time()
        
        # Create Image object from base64
        image = Image.from_base64("image/png", base64_image)
        
        # Call BAML function
        result = b.AnalyzeFocus(image, focus_description)
        
        analysis_time = time.time() - start_time
        logger.info(f"BAML analysis completed in {analysis_time:.3f}s")
        
        return {
            'negative_stimulus': result.negative_stimulus,
            #'analysis': result.analysis,
        }
        
    except Exception as e:
        logger.error(f"BAML analysis error: {e}", exc_info=True)
        raise

async def analyze_focus_with_baml(base64_image, focus_description):
    """
    Non-blocking wrapper for BAML analysis using thread pool
    """
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor(max_workers=4) as executor:
        return await loop.run_in_executor(executor, _analyze_focus_sync, base64_image, focus_description)

async def send_pavlok_stimulus(pavlok_token, stimulus_type='zap', intensity=50):
    """
    Send stimulus to Pavlok device
    """
    try:
        # Set intensity to 10 for zap stimulus
        if stimulus_type == 'zap':
            intensity = 10
            
        logger.info(f"Sending Pavlok stimulus: type={stimulus_type}, intensity={intensity}")
        start_time = time.time()
        
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
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=data, timeout=10)
            response.raise_for_status()
        
        pavlok_time = time.time() - start_time
        logger.info(f"Pavlok API call successful in {pavlok_time:.3f}s")
        
        return {'success': True, 'pavlok_response': response.json()}
        
    except requests.exceptions.RequestException as e:
        pavlok_time = time.time() - start_time
        logger.error(f"Pavlok API error after {pavlok_time:.3f}s: {e}")
        return {'success': False, 'error': str(e)}