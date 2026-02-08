import React from 'react';
import { Timer, Wind, Waves, AlertTriangle, KeyRound } from 'lucide-react';

export default function MeterPanel({ vars, scenarioId, timeRemaining }) {
  const isSubmarine = scenarioId === 'submarine_escape';

  const formatTime = (seconds) => {
    if (seconds == null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="meter-panel">
      {/* Timer (submarine only) */}
      {timeRemaining != null && (
        <div className={`meter timer-meter ${timeRemaining < 120 ? 'danger' : ''}`}>
          <span className="meter-icon"><Timer size={18} /></span>
          <span className="meter-label">Time</span>
          <span className="meter-value">{formatTime(timeRemaining)}</span>
        </div>
      )}

      {isSubmarine ? (
        <>
          <div className={`meter ${vars.oxygen <= 30 ? 'danger' : vars.oxygen <= 50 ? 'warning' : ''}`}>
            <span className="meter-icon"><Wind size={18} /></span>
            <span className="meter-label">Oxygen</span>
            <div className="meter-bar-wrap">
              <div
                className="meter-bar oxygen-bar"
                style={{ width: `${Math.max(0, Math.min(100, vars.oxygen))}%` }}
              />
            </div>
            <span className="meter-value">{vars.oxygen}%</span>
          </div>
          <div className={`meter ${vars.water >= 70 ? 'danger' : vars.water >= 50 ? 'warning' : ''}`}>
            <span className="meter-icon"><Waves size={18} /></span>
            <span className="meter-label">Water</span>
            <div className="meter-bar-wrap">
              <div
                className="meter-bar water-bar"
                style={{ width: `${Math.max(0, Math.min(100, vars.water))}%` }}
              />
            </div>
            <span className="meter-value">{vars.water}%</span>
          </div>
        </>
      ) : (
        <>
          <div className={`meter ${vars.alert >= 70 ? 'danger' : vars.alert >= 50 ? 'warning' : ''}`}>
            <span className="meter-icon"><AlertTriangle size={18} /></span>
            <span className="meter-label">Alert</span>
            <div className="meter-bar-wrap">
              <div
                className="meter-bar alert-bar"
                style={{ width: `${Math.max(0, Math.min(100, vars.alert))}%` }}
              />
            </div>
            <span className="meter-value">{vars.alert}%</span>
          </div>
          <div className={`meter ${vars.attemptsLeft <= 1 ? 'danger' : vars.attemptsLeft <= 2 ? 'warning' : ''}`}>
            <span className="meter-icon"><KeyRound size={18} /></span>
            <span className="meter-label">Attempts Left</span>
            <span className="meter-value meter-value-large">{vars.attemptsLeft}</span>
          </div>
        </>
      )}
    </div>
  );
}
