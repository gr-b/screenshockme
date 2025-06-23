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
  const [showStimulusModal, setShowStimulusModal] = useState(false);
  const [modalTimeoutId, setModalTimeoutId] = useState(null);
  const [beepIntervalId, setBeepIntervalId] = useState(null);

  const intervalRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const initializingRef = useRef(false);

  // Audio context for beep sounds
  const audioContextRef = useRef(null);

  const playBeep = useCallback(() => {
    console.log("PLAYING BEEP")
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
    oscillator.stop(ctx.currentTime + 1);
  }, []);

  // Initialize screen capture once on component mount
  const initializeScreenCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: false
      });

      streamRef.current = stream;
      
      // Create video element for capturing frames
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.play();
      videoRef.current = video;

      // Handle stream ending (user stops sharing)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('Screen sharing ended by user');
        onStopMonitoring();
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize screen capture:', error);
      alert('Screen capture permission is required for monitoring. Please allow screen sharing and try again.');
      onStopMonitoring();
      return false;
    }
  }, [onStopMonitoring]);

  const captureScreen = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) {
      console.error('Screen capture not initialized');
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, 500, 500);
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result.split(',')[1]); // Remove data:image/png;base64, prefix
          };
          reader.readAsDataURL(blob);
        }, 'image/png');
      });
    } catch (error) {
      console.error('Failed to capture screen:', error);
      return null;
    }
  }, []);

  const sendMonitorRequest = useCallback(async (base64Image) => {
    if (!base64Image) return;

    try {

      const response = await fetch(`${API_BASE_URL}/api/monitor/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64_encoded_image: base64Image,
          focus_description: config.focusDescription,
          pavlok_token: config.pavlokToken,
          stimulus_type: config.stimulusType
        })
      });

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
        
        // Clear any existing modal timeout
        if (modalTimeoutId) {
          clearTimeout(modalTimeoutId);
        }
        
        // Show stimulus modal and set new timeout
        setShowStimulusModal(true);
        const newTimeoutId = setTimeout(() => setShowStimulusModal(false), 750);
        setModalTimeoutId(newTimeoutId);
        
        // Reset the timer
        setDuration(0);
        startTimeRef.current = Date.now();
        
        // Handle computer beep stimulus
        if (config.stimulusType === 'computer_beep') {
          // Clear any existing beep interval
          if (beepIntervalId) {
            clearInterval(beepIntervalId);
          }
          
          // Play immediate beep
          playBeep();
          
          // Start sustained beeping every 500ms
          const newBeepInterval = setInterval(playBeep, 500);
          setBeepIntervalId(newBeepInterval);
          
          // Stop sustained beeping after 750ms
          setTimeout(() => {
            clearInterval(newBeepInterval);
            setBeepIntervalId(null);
          }, 750);
        }
      }
    } catch (error) {
      console.error('Monitor request failed:', error);
    }
  }, [config, playBeep]);

  const monitoringLoop = useCallback(async () => {
    if (!isMonitoring) return;

    const screenshot = await captureScreen();
    if (screenshot) {
      await sendMonitorRequest(screenshot);
    }
  }, [isMonitoring, captureScreen, sendMonitorRequest]);

  // Initialize screen capture on mount
  React.useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;
    
    initializeScreenCapture();
    
    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (modalTimeoutId) clearTimeout(modalTimeoutId);
      if (beepIntervalId) clearInterval(beepIntervalId);
    };
  }, [initializeScreenCapture]);

  // Start monitoring loop
  React.useEffect(() => {
    if (isMonitoring) {
      intervalRef.current = setInterval(monitoringLoop, 500);
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
      if (modalTimeoutId) clearTimeout(modalTimeoutId);
      if (beepIntervalId) clearInterval(beepIntervalId);
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

  const handleStopMonitoring = () => {
    // Stop the screen sharing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear intervals and timeouts
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    if (modalTimeoutId) clearTimeout(modalTimeoutId);
    if (beepIntervalId) clearInterval(beepIntervalId);
    
    // Call parent's stop handler
    onStopMonitoring();
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
            onClick={handleStopMonitoring}
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

      {/* Stimulus Modal */}
      {showStimulusModal && (
        <div className="stimulus-modal-overlay">
          <div className="stimulus-modal">
            <div className="stimulus-modal-content">
              Stimulus triggered!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonitoringPage;