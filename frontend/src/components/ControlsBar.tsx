import React from 'react';
import type { DateRangeOption, ViewStateType, RegionData } from '../types/dashboard';
import { MapPin, Calendar, SlidersHorizontal, AlertCircle, ShieldCheck } from 'lucide-react';

interface ControlsBarProps {
  selectedRegionId: string;
  onRegionChange: (id: string) => void;
  dateRange: DateRangeOption;
  onDateRangeChange: (range: DateRangeOption) => void;
  viewState: ViewStateType;
  onViewStateChange: (state: ViewStateType) => void;
  regions: RegionData[];
  isAuthentic: boolean;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  selectedRegionId,
  onRegionChange,
  dateRange,
  onDateRangeChange,
  viewState,
  onViewStateChange,
  regions,
  isAuthentic,
}) => {
  return (
    <div className="controls-bar-container" role="region" aria-label="Dashboard Controls">
      {/* Dynamic Data Provenance Strip */}
      <div className={`demo-disclaimer-strip ${isAuthentic ? 'authentic-strip' : ''}`}>
        {isAuthentic ? (
          <>
            <span className="nasa-live-badge">
              <ShieldCheck size={12} />
              AUTHENTIC NASA FIRMS DATA
            </span>
            <span className="demo-text">
              Connected to FastAPI backend. Loaded 654 consecutive daily observations from NOAA-20 VIIRS 375m (33.72M records).
            </span>
          </>
        ) : (
          <>
            <span className="demo-badge">REGIONAL DEMO PREVIEW</span>
            <span className="demo-text">
              Displaying simulated spatial subset for biome preview. Select "Global Monitored Landmasses" for authentic NASA telemetry.
            </span>
          </>
        )}
      </div>

      <div className="controls-bar">
        {/* Region / Scope Selector */}
        <div className="control-group">
          <label className="control-label" htmlFor="target-region-select">
            <MapPin size={14} className="control-icon" />
            <span>Target Region:</span>
          </label>
          <select
            id="target-region-select"
            className="control-select"
            value={selectedRegionId}
            onChange={(e) => onRegionChange(e.target.value)}
            aria-label="Select Target Region"
          >
            {(regions || []).map((region) => (
              <option key={region.id} value={region.id}>
                {region.isAuthenticData ? '🛰️ ' : '🌲 '}
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Selector */}
        <div className="control-group">
          <span className="control-label" id="history-window-label">
            <Calendar size={14} className="control-icon" />
            <span>History Window:</span>
          </span>
          <div className="segmented-control" role="group" aria-labelledby="history-window-label">
            <button
              className={`segment-btn ${dateRange === '7d' ? 'active' : ''}`}
              onClick={() => onDateRangeChange('7d')}
              aria-pressed={dateRange === '7d'}
            >
              7 Days
            </button>
            <button
              className={`segment-btn ${dateRange === '14d' ? 'active' : ''}`}
              onClick={() => onDateRangeChange('14d')}
              aria-pressed={dateRange === '14d'}
            >
              14 Days
            </button>
            <button
              className={`segment-btn ${dateRange === '30d' ? 'active' : ''}`}
              onClick={() => onDateRangeChange('30d')}
              aria-pressed={dateRange === '30d'}
            >
              30 Days
            </button>
            <button
              className={`segment-btn ${dateRange === '60d' ? 'active' : ''}`}
              onClick={() => onDateRangeChange('60d')}
              aria-pressed={dateRange === '60d'}
            >
              60 Days
            </button>
            <button
              className={`segment-btn ${dateRange === 'all' ? 'active' : ''}`}
              onClick={() => onDateRangeChange('all')}
              aria-pressed={dateRange === 'all'}
            >
              All (654d)
            </button>
          </div>
        </div>

        {/* View State Simulator */}
        <div className="control-group state-simulation-group">
          <label className="control-label" htmlFor="ui-state-select">
            <SlidersHorizontal size={14} className="control-icon" />
            <span>UI State:</span>
          </label>
          <select
            id="ui-state-select"
            className="control-select state-select"
            value={viewState}
            onChange={(e) => onViewStateChange(e.target.value as ViewStateType)}
            aria-label="Simulated UI State"
            title="Switch UI state to test Loading, Empty, and Error layouts"
          >
            <option value="normal">Normal (Active Data)</option>
            <option value="loading">Loading Simulation</option>
            <option value="empty">Empty Data State</option>
            <option value="error">Error / Dropout State</option>
          </select>
        </div>
      </div>

      {viewState !== 'normal' && (
        <div className="state-notice-banner">
          <AlertCircle size={14} />
          <span>
            Simulating <strong>{viewState.toUpperCase()}</strong> UI state. Use the "UI State" dropdown above to return to Normal view.
          </span>
        </div>
      )}
    </div>
  );
};
