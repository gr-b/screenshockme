import React, { useState, useRef, useCallback } from 'react';
import { Pause, Play, ChevronDown, ChevronUp, X } from 'lucide-react';
import './MonitoringPage.css';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000' 
  : '';

function MonitoringPage({ config, onStopMonitoring }) {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [duration, setDuration] = useState(0);
  const [debugExpanded, setDebugExpanded] = useState(false);
  const [debugHistory, setDebugHistory] = useState([]);
  const [lastStimulusTime, setLastStimulusTime] = useState(0);
  const [currentRequest, setCurrentRequest] = useState(null);

  const intervalRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Audio context for beep sounds
  const audioContextRef = useRef(null);

  const playBeep = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }, []);

  const captureScreen = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: false
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          
          stream.getTracks().forEach(track => track.stop());
          
          canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result.split(',')[1]); // Remove data:image/png;base64, prefix
            };
            reader.readAsDataURL(blob);
          }, 'image/png');
        };
      });
    } catch (error) {
      console.error('Failed to capture screen:', error);
      return null;
    }
  }, []);

  const sendMonitorRequest = useCallback(async (base64Image) => {
    if (!base64Image) return;

    try {
      const requestTime = Date.now();
      setCurrentRequest(requestTime);

      const response = await fetch(`${API_BASE_URL}/api/monitor/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64_encoded_image: base64Image,
          focus_description: config.focusDescription,
          pavlok_token: config.pavlokToken
        })
      });

      // Only proceed if this is still the current request
      if (currentRequest !== requestTime) return;

      setCurrentRequest(null);

      const data = await response.json();
      
      // Add to debug history
      const debugEntry = {
        timestamp: new Date().toLocaleTimeString(),
        screenshot: `data:image/png;base64,${base64Image}`,
        response: data,
        stimulusDelivered: data.negative_stimulus
      };
      
      setDebugHistory(prev => [debugEntry, ...prev.slice(0, 9)]);

      if (data.negative_stimulus) {
        setLastStimulusTime(Date.now());
        
        // Reset the timer
        setDuration(0);
        startTimeRef.current = Date.now();
        
        // Play computer beep if selected
        if (config.stimulusType === 'computer_beep') {
          playBeep();
        }
      }
    } catch (error) {
      console.error('Monitor request failed:', error);
      setCurrentRequest(null);
    }
  }, [config, currentRequest, playBeep]);

  const monitoringLoop = useCallback(async () => {
    if (!isMonitoring) return;

    const now = Date.now();
    
    // Don't send request if less than 5 seconds since last stimulus
    if (now - lastStimulusTime < 5000) {
      return;
    }

    // Don't send request if there's already one pending (unless it's been >5 seconds)
    if (currentRequest && now - currentRequest < 5000) {
      return;
    }

    const screenshot = await captureScreen();
    if (screenshot) {
      await sendMonitorRequest(screenshot);
    }
  }, [isMonitoring, lastStimulusTime, currentRequest, captureScreen, sendMonitorRequest]);

  // Start monitoring loop
  React.useEffect(() => {
    if (isMonitoring) {
      intervalRef.current = setInterval(monitoringLoop, 1000);
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [isMonitoring, monitoringLoop]);

  const toggleMonitoring = () => {
    if (!isMonitoring) {
      startTimeRef.current = Date.now() - (duration * 1000);
    }
    setIsMonitoring(!isMonitoring);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="monitoring-page">
      <div className="monitoring-header">
        <h1 className="hero-title rainbow-text">
          SCREENSHOCK.me: If you get distracted, AI zaps you!
        </h1>
        
        <div className="duration-display">
          <div className="duration-label">Focus Duration</div>
          <div className="duration-time">{formatDuration(duration)}</div>
        </div>

        <div className="controls">
          <button
            onClick={toggleMonitoring}
            className={`control-button ${isMonitoring ? 'pause' : 'play'}`}
          >
            {isMonitoring ? (
              <>
                <Pause className="button-icon" />
                Pause monitoring
              </>
            ) : (
              <>
                <Play className="button-icon" />
                Restart monitoring
              </>
            )}
          </button>

          <button
            onClick={onStopMonitoring}
            className="stop-button"
          >
            <X className="button-icon" />
            Stop & Exit
          </button>
        </div>
      </div>

      <div className="debug-section">
        <button
          onClick={() => setDebugExpanded(!debugExpanded)}
          className="debug-toggle"
        >
          {debugExpanded ? <ChevronUp /> : <ChevronDown />}
          Debug Information ({debugHistory.length}/10)
        </button>

        {debugExpanded && (
          <div className="debug-content">
            {debugHistory.length === 0 ? (
              <div className="debug-empty">No debug data yet. Monitoring will begin shortly...</div>
            ) : (
              debugHistory.map((entry, index) => (
                <div key={index} className={`debug-entry ${entry.stimulusDelivered ? 'stimulus' : ''}`}>
                  <div className="debug-screenshot">
                    <img src={entry.screenshot} alt={`Screenshot ${entry.timestamp}`} />
                    <div className="screenshot-timestamp">{entry.timestamp}</div>
                  </div>
                  <div className="debug-response">
                    <div className="response-status">
                      {entry.stimulusDelivered ? (
                        <span className="stimulus-triggered">⚡ STIMULUS TRIGGERED</span>
                      ) : (
                        <span className="focus-maintained">✅ Focus maintained</span>
                      )}
                    </div>
                    <pre className="response-data">
                      {JSON.stringify(entry.response, null, 2)}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MonitoringPage;