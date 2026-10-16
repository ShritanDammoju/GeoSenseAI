import React from 'react';
import { Loader2, Database, AlertTriangle, RefreshCcw } from 'lucide-react';
import type { ViewStateType } from '../types/dashboard';

interface StateFeedbackProps {
  state: ViewStateType;
  onReset?: () => void;
  message?: string;
}

export const StateFeedback: React.FC<StateFeedbackProps> = ({
  state,
  onReset,
  message,
}) => {
  if (state === 'loading') {
    return (
      <div className="state-feedback-card loading-state">
        <Loader2 className="spinning-icon" size={36} />
        <h3>Fetching Satellite Telemetry...</h3>
        <p>Retrieving thermal sensor passes and aggregating daily spatial detection counts.</p>
        <div className="skeleton-grid">
          <div className="skeleton-box pulse-animation"></div>
          <div className="skeleton-box pulse-animation"></div>
          <div className="skeleton-box pulse-animation"></div>
        </div>
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div className="state-feedback-card empty-state">
        <div className="state-icon-circle empty-circle">
          <Database size={32} />
        </div>
        <h3>No Hotspot Records Found</h3>
        <p>
          {message ||
            'There are zero satellite thermal anomaly detections registered in this spatial bounding box for the selected date window.'}
        </p>
        {onReset && (
          <button className="state-action-btn" onClick={onReset}>
            <RefreshCcw size={14} />
            <span>Reset Filters & Return to Demo Data</span>
          </button>
        )}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="state-feedback-card error-state">
        <div className="state-icon-circle error-circle">
          <AlertTriangle size={32} />
        </div>
        <h3>Satellite Telemetry Ingestion Warning</h3>
        <p>
          {message ||
            'Sensor communication timeout or heavy cloud obscuration flagged for this observation orbit. Data pipeline simulated an error condition.'}
        </p>
        {onReset && (
          <button className="state-action-btn error-btn" onClick={onReset}>
            <RefreshCcw size={14} />
            <span>Clear Simulation Error</span>
          </button>
        )}
      </div>
    );
  }

  return null;
};
