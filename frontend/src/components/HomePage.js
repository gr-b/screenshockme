import React, { useState } from 'react';
import { HelpCircle, Twitter, Zap, Eye, Monitor } from 'lucide-react';
import './HomePage.css';
import PavlokModal from './PavlokModal';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000' 
  : '';

function HomePage({ onStartMonitoring }) {
  const [focusDescription, setFocusDescription] = useState(
    "I'm trying to stay focused on writing an essay, but I keep getting distracted by watching cat videos. I also want to stay off of Hacker News and Reddit"
  );
  const [stimulusType, setStimulusType] = useState('computer_beep');
  const [pavlokToken, setPavlokToken] = useState('');
  const [showPavlokModal, setShowPavlokModal] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const stimulusOptions = [
    { value: 'computer_beep', label: 'loud beep (through your computer)' },
    { value: 'pavlok_zap', label: 'zap (requires Pavlok device)' },
    { value: 'pavlok_beep', label: 'loud beep (through your Pavlok device)' },
    { value: 'pavlok_vibe', label: 'vibrate (through your Pavlok device)' }
  ];

  const requiresPavlok = (type) => {
    return type.startsWith('pavlok_');
  };

  const handleStartMonitoring = async () => {
    if (requiresPavlok(stimulusType) && !pavlokToken.trim()) {
      alert('Please enter your Pavlok token for device-based stimulus.');
      return;
    }

    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: false
      });

      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());

      const config = {
        focusDescription,
        stimulusType,
        pavlokToken: requiresPavlok(stimulusType) ? pavlokToken : null
      };

      onStartMonitoring(config);
    } catch (error) {
      console.error('Screen capture permission denied:', error);
      alert('Screen capture permission is required for monitoring. Please allow screen sharing and try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="homepage">
      <div className="hero-section">
        <h1 className="hero-title rainbow-text">
          SCREENSHOCK.me: If you get distracted, AI zaps you!
        </h1>
        
        <div className="infographic-container">
          <img 
            src="/infographic.png" 
            alt="How Screenshock.me works" 
            className="infographic"
          />
        </div>

        <div className="explanation">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-text">Describe what you are trying to focus on</div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-text">Describe what you might find yourself distracted by that you want to avoid</div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-text">Set negative stimulus to be delivered when your focus strays: zap, beep, or vibrate (zap and vibrate require Pavlok device)</div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-text">Share your screen (screenshock.me will ask for this like a video call)</div>
          </div>
          <div className="step">
            <div className="step-number">5</div>
            <div className="step-text">Get zapped if you stray from focus!</div>
          </div>
        </div>
      </div>

      <div className="config-section">
        <div className="input-group">
          <textarea
            className="focus-input rainbow-border"
            value={focusDescription}
            onChange={(e) => setFocusDescription(e.target.value)}
            placeholder="Describe your focus goals and distractions..."
            rows={4}
          />
        </div>

        <div className="stimulus-config">
          <h3>NEGATIVE STIMULUS CONFIGURATION:</h3>
          <div className="stimulus-dropdown">
            <select
              value={stimulusType}
              onChange={(e) => setStimulusType(e.target.value)}
              className="stimulus-select rainbow-border"
            >
              {stimulusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {requiresPavlok(stimulusType) && (
            <div className="pavlok-config">
              <div className="pavlok-token-group">
                <input
                  type="text"
                  placeholder="Enter your Pavlok API token"
                  value={pavlokToken}
                  onChange={(e) => setPavlokToken(e.target.value)}
                  className="pavlok-input rainbow-border"
                />
                <button
                  onClick={() => setShowPavlokModal(true)}
                  className="help-button"
                  title="What is Pavlok?"
                >
                  <HelpCircle size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleStartMonitoring}
          disabled={isCapturing}
          className="start-button rainbow-border"
        >
          {isCapturing ? (
            <>
              <Monitor className="button-icon" />
              Requesting screen access...
            </>
          ) : (
            <>
              <Eye className="button-icon" />
              Start monitoring
            </>
          )}
        </button>

        <div className="footer">
          <Twitter size={20} />
          <span>Follow me on X: @griffbish</span>
        </div>
      </div>

      {showPavlokModal && (
        <PavlokModal onClose={() => setShowPavlokModal(false)} />
      )}
    </div>
  );
}

export default HomePage;