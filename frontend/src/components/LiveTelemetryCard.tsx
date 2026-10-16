import React from 'react';
import type { LiveFirmsPayload } from '../types/dashboard';
import { 
  Radio, 
  RefreshCw, 
  Clock, 
  Satellite, 
  Flame, 
  AlertTriangle, 
  CheckCircle2,
  Info
} from 'lucide-react';

interface LiveTelemetryCardProps {
  liveData: LiveFirmsPayload | null;
  loading: boolean;
  error: string | null;
  onRefresh: (forceRefresh?: boolean) => void;
}

export const LiveTelemetryCard: React.FC<LiveTelemetryCardProps> = ({
  liveData,
  loading,
  error,
  onRefresh,
}) => {
  const latestDateEntry = liveData?.detections_by_date?.[liveData.detections_by_date.length - 1];

  const formatRefreshTime = (isoString?: string) => {
    if (!isoString) return 'Pending initial fetch';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const isStale = Boolean(error && liveData);

  return (
    <div className={`live-telemetry-container ${isStale ? 'is-stale' : ''}`}>
      <div className="live-telemetry-header">
        <div className="live-header-title-group">
          <div className="live-indicator-pill">
            <span className={`live-pulse-dot ${isStale ? 'stale-pulse' : ''}`} />
            <Radio size={14} className="live-radio-icon" />
            <span>{isStale ? 'STALE SATELLITE FEED' : 'LIVE SATELLITE FEED'}</span>
          </div>
          <div>
            <h3 className="live-title">NASA FIRMS Near-Real-Time Observations</h3>
            <p className="live-subtitle">
              Authentic satellite thermal anomaly detections direct from NASA LANCE / FIRMS API (JPSS-1 NOAA-20 VIIRS)
            </p>
          </div>
        </div>

        <div className="live-actions">
          <div className="live-cache-status">
            <Clock size={13} className="text-muted" />
            <span className="live-refresh-label">
              Updated: <strong>{formatRefreshTime(liveData?.refresh_timestamp)}</strong>
            </span>
            {isStale && (
              <span className="stale-pill" title="Refresh failed; preserving last successful observation data">
                Stale (Retained)
              </span>
            )}
            {!isStale && liveData?.cached && (
              <span className="cache-pill" title="Served from 10-minute in-memory cache to conserve NASA transaction quota">
                Cached
              </span>
            )}
          </div>

          <button
            className="live-refresh-btn"
            onClick={() => onRefresh(true)}
            disabled={loading}
            title="Force fresh query to NASA FIRMS API"
            aria-label="Refresh NASA FIRMS live telemetry"
          >
            <RefreshCw size={13} className={loading ? 'spinning' : ''} />
            <span>{loading ? 'Fetching NASA...' : 'Refresh Feed'}</span>
          </button>
        </div>
      </div>

      {/* Stale Warning Banner (when error occurs but previous data is retained) */}
      {isStale && (
        <div className="live-stale-banner" role="alert">
          <AlertTriangle size={16} className="text-amber" />
          <div className="live-error-content">
            <p className="live-error-title">Refresh Warning: Unable to reach NASA FIRMS</p>
            <p className="live-error-desc">
              {error}. Preserving last successful observations from {formatRefreshTime(liveData?.refresh_timestamp)}.
            </p>
          </div>
          <button className="live-retry-btn" onClick={() => onRefresh(true)} disabled={loading}>
            Retry
          </button>
        </div>
      )}

      {/* Standalone Error Banner (when initial load failed and no data exists) */}
      {error && !liveData ? (
        <div className="live-error-banner" role="alert">
          <AlertTriangle size={18} className="text-amber" />
          <div className="live-error-content">
            <p className="live-error-title">Unable to reach NASA FIRMS Live Telemetry</p>
            <p className="live-error-desc">{error}</p>
          </div>
          <button className="live-retry-btn" onClick={() => onRefresh(true)} disabled={loading}>
            Retry
          </button>
        </div>
      ) : loading && !liveData ? (
        <div className="live-loading-banner">
          <div className="live-spinner-mini" />
          <span>Connecting to NASA FIRMS Near-Real-Time Gateway...</span>
        </div>
      ) : liveData && latestDateEntry ? (
        <div className="live-metrics-row">
          {/* Metric 1: Latest Detection Count */}
          <div className={`live-metric-card primary-live ${isStale ? 'stale-card' : ''}`}>
            <div className="live-metric-top">
              <span className="live-metric-label">Latest Live Active Fires</span>
              <span className="partial-badge">
                {latestDateEntry.status === 'partial_or_near_real_time' ? 'PARTIAL / NRT' : 'COMPLETE'}
              </span>
            </div>
            <div className="live-metric-val-row">
              <Flame size={24} className="live-fire-icon" />
              <span className="live-metric-val">{latestDateEntry.detection_count.toLocaleString()}</span>
              <span className="live-metric-unit">detections</span>
            </div>
            <p className="live-metric-subtext">
              Observed on <strong>{latestDateEntry.observation_date}</strong>.
              {latestDateEntry.status === 'partial_or_near_real_time' && (
                <span className="partial-warning-note">
                  {' '}(Partial day telemetry in progress; not a final 24h total).
                </span>
              )}
            </p>
          </div>

          {/* Metric 2: Sensor & Satellite Provenance */}
          <div className="live-metric-card">
            <div className="live-metric-top">
              <span className="live-metric-label">Observing Instrument</span>
              <span className="sensor-badge">375m Spatial Res</span>
            </div>
            <div className="live-metric-val-row">
              <Satellite size={20} className="sensor-icon" />
              <span className="live-metric-val-sm">{liveData.satellite}</span>
            </div>
            <p className="live-metric-subtext">
              Sensor: <strong>{liveData.instrument}</strong> (NASA LANCE / EOSDIS)
            </p>
          </div>

          {/* Metric 3: Mean Thermal Intensity */}
          <div className="live-metric-card">
            <div className="live-metric-top">
              <span className="live-metric-label">Mean Fire Radiative Power</span>
              <span className="sensor-badge">MW Intensity</span>
            </div>
            <div className="live-metric-val-row">
              <span className="live-metric-val-sm">{latestDateEntry.mean_frp_mw.toFixed(2)}</span>
              <span className="live-metric-unit">MW / pixel</span>
            </div>
            <p className="live-metric-subtext">
              Direct thermal radiant energy measured at 3.74 μm (I4 channel).
            </p>
          </div>

          {/* Metric 4: Pipeline Cadence & Separation Notice */}
          <div className="live-metric-card notice-card">
            <div className="live-metric-top">
              <span className="live-metric-label">Feed Notice & Policy</span>
              <CheckCircle2 size={14} className="text-emerald" />
            </div>
            <p className="live-notice-text">
              <Info size={13} className="notice-icon" />
              <span>
                <strong>Strict Data Separation:</strong> This live feed reflects incoming satellite telemetry for {latestDateEntry.observation_date}. Model forecasts and historical archives remain safely segregated. Live observations do NOT automatically retrain the forecasting model.
              </span>
            </p>
            <p className="live-cadence-note">
              Overpasses occur at ~1:30 PM/AM local solar time. Downlinks arrive continuously.
            </p>
          </div>
        </div>
      ) : (
        <div className="live-empty-state">
          <span>No live telemetry records available for the requested time window.</span>
        </div>
      )}
    </div>
  );
};
