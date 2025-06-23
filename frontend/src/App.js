import React, { useState } from 'react';
import './App.css';
import HomePage from './components/HomePage';
import MonitoringPage from './components/MonitoringPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [monitoringConfig, setMonitoringConfig] = useState(null);

  const startMonitoring = (config) => {
    setMonitoringConfig(config);
    setCurrentPage('monitoring');
  };

  const stopMonitoring = () => {
    setCurrentPage('home');
    setMonitoringConfig(null);
  };

  return (
    <div className="App">
      {currentPage === 'home' && (
        <HomePage onStartMonitoring={startMonitoring} />
      )}
      {currentPage === 'monitoring' && (
        <MonitoringPage 
          config={monitoringConfig} 
          onStopMonitoring={stopMonitoring}
        />
      )}
    </div>
  );
}

export default App;