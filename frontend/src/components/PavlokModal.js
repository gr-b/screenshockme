import React from 'react';
import { X, ExternalLink, Zap } from 'lucide-react';
import './PavlokModal.css';

function PavlokModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Zap className="modal-icon" />
            What is Pavlok?
          </h2>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          <p>
            Pavlok is a wearable device that can deliver physical stimulus (zaps, beeps, or vibrations) 
            to help break bad habits and build good ones.
          </p>
          
          <h3>Getting your API Token:</h3>
          <ol>
            <li>Go to <a href="https://pavlok.readme.io/reference/intro/getting-started" target="_blank" rel="noopener noreferrer">Pavlok's developer API documentation</a></li>
            <li>Log into your Pavlok account (the one associated with your app, not the one you bought the wristband with)</li>
            <li>Generate or copy your API token</li>
            <li>Paste it into the token field here</li>
          </ol>
          
          <div className="warning">
            <strong>Important:</strong> Keep your API token private. Don't share it with others.
          </div>
          
          <div className="learn-more">
            <a 
              href="https://pavlok.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="external-link"
            >
              Learn more about Pavlok <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PavlokModal;