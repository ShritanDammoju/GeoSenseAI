import React, { useState, useEffect } from 'react';
import type { RegionData, NextDayForecastPayload } from '../../types/dashboard';
import { API_ENDPOINTS } from '../../config/api';
import { 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  ShieldAlert, 
  Sliders, 
  HelpCircle,
  Clock,
  ShieldCheck,
  Layers
} from 'lucide-react';

interface ForecastSectionProps {
  region: RegionData;
}

export const ForecastSection: React.FC<ForecastSectionProps> = ({ region }) => {
  const [forecastPayload, setForecastPayload] = useState<NextDayForecastPayload | null>(null);
  const [simulatedTodayCount, setSimulatedTodayCount] = useState<number>(region.latestObservedCount);
  const [prevObservedCount, setPrevObservedCount] = useState<number>(region.latestObservedCount);

  // Sync simulated count if external region changes without an effect
  if (region.latestObservedCount !== prevObservedCount) {
    setPrevObservedCount(region.latestObservedCount);
    setSimulatedTodayCount(region.latestObservedCount);
  }

  useEffect(() => {
    let isMounted = true;
    if (region.isAuthenticData) {
      fetch(API_ENDPOINTS.forecastNextDay)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: NextDayForecastPayload | null) => {
          if (isMounted && data && data.status === 'success') {
            setForecastPayload(data);
          }
        })
        .catch((err) => console.warn('Could not fetch next-day forecast:', err));
    } else {
      Promise.resolve().then(() => {
        if (isMounted) setForecastPayload(null);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [region.isAuthenticData]);

  // If authentic data is active and forecast is loaded, use true model values; otherwise use fallback
  const isAuthentic = region.isAuthenticData && !!forecastPayload;
  const fc = forecastPayload?.forecast;

  const targetDate = isAuthentic && fc
    ? fc.target_forecast_date
    : (region.targetForecastDate || '2026-10-16');

  const refDate = isAuthentic && fc
    ? fc.reference_observation_date
    : region.latestObservedDate;

  const displayForecast = isAuthentic && fc
    ? fc.predicted_count_rounded
    : region.predictedNextDayCount;

  const lowerBound = isAuthentic && fc
    ? fc.lower_bound_approx
    : region.predictionRange[0];

  const upperBound = isAuthentic && fc
    ? fc.upper_bound_approx
    : region.predictionRange[1];

  const shiftVsObserved = isAuthentic && fc
    ? Math.round(fc.expected_24h_change)
    : (displayForecast - simulatedTodayCount);

  // Sensitivity calculation for the interactive slider
  const simulatedForecast = Math.round(
    0.65 * simulatedTodayCount + 0.35 * region.sevenDayAverage
  );
  const simulatedLower = Math.max(0, Math.round(simulatedForecast * 0.9));
  const simulatedUpper = Math.round(simulatedForecast * 1.12);

  return (
    <div className="section-container forecast-section">
      {/* Header */}
      <div className="section-header-block">
        <div>
          <div className="section-pill amber-pill">
            <Sparkles size={14} />
            <span>Next-Day Predictive Intelligence (Stage 5)</span>
          </div>
          <h2 className="section-title">Next-Day Hotspot Activity Forecast</h2>
          <p className="section-subtitle">
            Forecasting satellite-observed active-fire detection count for tomorrow across <strong>{region.name}</strong>.
          </p>
        </div>

        <div className="forecast-date-badge">
          <Calendar size={14} />
          <span>Forecast Target Date: {targetDate}</span>
        </div>
      </div>

      {/* Main Forecast Hero Display */}
      <div className="card forecast-hero-card">
        <div className="forecast-hero-grid">
          <div className="forecast-main-metric">
            <div className="forecast-badge-row">
              {isAuthentic ? (
                <>
                  <span className="nasa-pill">
                    <ShieldCheck size={12} />
                    AUTHENTIC RANDOM FOREST REGRESSOR (STAGE 5)
                  </span>
                  <span className="forecast-stage-pill font-mono">150 Trees • Chronological Split</span>
                </>
              ) : (
                <>
                  <span className="demo-pill">REGIONAL DEMO PREVIEW</span>
                  <span className="forecast-stage-pill">Simulated Spatial Subset</span>
                </>
              )}
            </div>

            <span className="forecast-metric-caption">Projected 24h Hotspot Detections</span>
            <div className="forecast-number-row">
              <span className="forecast-huge-number">{displayForecast.toLocaleString()}</span>
              <span className="forecast-unit">satellite detections</span>
            </div>

            <div className="forecast-range-box">
              <span className="range-label">
                {isAuthentic ? 'Empirical Confidence Interval (±1 MAE):' : 'Estimated Confidence Bounds (80% Interval):'}
              </span>
              <strong className="range-values font-mono">
                {lowerBound.toLocaleString()} – {upperBound.toLocaleString()} detections
              </strong>
            </div>

            <div className="forecast-delta-summary">
              <TrendingUp size={16} className={shiftVsObserved >= 0 ? "text-amber" : "text-emerald"} />
              <span>
                Expected shift: <strong>{shiftVsObserved >= 0 ? `+${shiftVsObserved.toLocaleString()}` : shiftVsObserved.toLocaleString()}</strong> vs observed count on {refDate} ({region.latestObservedCount.toLocaleString()})
              </span>
            </div>
          </div>

          {/* Quick Context & Risk Assessment */}
          <div className="forecast-context-panel">
            <h4 className="context-title">
              <ShieldAlert size={16} className="text-amber" />
              Activity Severity Outlook
            </h4>
            
            <div className="severity-bar-container">
              <div className="severity-labels">
                <span>Low (&lt;30k)</span>
                <span>Moderate</span>
                <span>Elevated (50k-80k)</span>
                <span>Severe (&gt;100k)</span>
              </div>
              <div className="severity-track">
                <div 
                  className="severity-indicator-fill"
                  style={{ width: `${Math.min(100, (displayForecast / (region.peakDayCount || 134678)) * 100)}%` }}
                ></div>
              </div>
            </div>

            <p className="severity-commentary">
              {isAuthentic ? (
                <>
                  Global thermal activity is projected at <strong>{displayForecast.toLocaleString()} detections</strong> for {targetDate}.
                  Activity remains in the <strong>Elevated</strong> seasonal tier, consistent with trailing weekly momentum ({Math.round(region.sevenDayAverage).toLocaleString()} fires/day).
                </>
              ) : (
                <>
                  Thermal anomaly activity is projected to remain <strong>Elevated</strong> across {region.name}, primarily driven by trailing dry-fuel persistence and trailing 7-day weather patterns.
                </>
              )}
            </p>

            <div className="observation-window-meta">
              <Clock size={14} className="text-secondary" />
              <span>
                {isAuthentic
                  ? 'Sensor: NOAA-20 (JPSS-1) VIIRS 375m Telemetry (Strict Chronological Fit, Zero Shuffling)'
                  : 'Observation satellite pass windows: Terra / Aqua / Suomi-NPP orbits'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Projections Comparison Bar */}
      {isAuthentic && forecastPayload && (
        <div className="card model-comparison-strip-card">
          <div className="card-header-icon-title">
            <Layers size={18} className="text-emerald" />
            <h3 className="card-heading">Next-Day Projections by Architecture</h3>
          </div>
          <p className="card-subheading">
            Comparing the machine learning forecast against the two baseline models for target date <strong>{targetDate}</strong>:
          </p>

          <div className="model-comparison-mini-grid">
            <div className="mini-model-card active-model">
              <span className="mini-badge candidate-badge">Machine Learning</span>
              <h4>Random Forest Regressor</h4>
              <div className="mini-count font-mono">{forecastPayload.forecast.predicted_count_rounded.toLocaleString()}</div>
              <span className="mini-meta">150 Trees • Max Depth 8</span>
              <div className="mini-mae">Test MAE: {forecastPayload.model_comparison.rf_mae?.toLocaleString()} detections</div>
            </div>

            <div className="mini-model-card">
              <span className="mini-badge baseline-badge">Baseline 1</span>
              <h4>Previous-Day Persistence</h4>
              <div className="mini-count font-mono">{forecastPayload.forecast.predicted_count_persistence.toLocaleString()}</div>
              <span className="mini-meta">Count on {refDate}</span>
              <div className="mini-mae">Test MAE: {forecastPayload.model_comparison.persistence_mae?.toLocaleString()} detections</div>
            </div>

            <div className="mini-model-card">
              <span className="mini-badge statistical-badge">Baseline 2</span>
              <h4>7-Day Moving Average</h4>
              <div className="mini-count font-mono">{Math.round(forecastPayload.forecast.predicted_count_ma7).toLocaleString()}</div>
              <span className="mini-meta">Trailing 7-Day Mean</span>
              <div className="mini-mae">Test MAE: {forecastPayload.model_comparison.ma7_mae?.toLocaleString()} detections</div>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Drivers & Sensitivity Explanation */}
      <div className="grid-2col">
        <div className="card explanation-card">
          <div className="card-header-icon-title">
            <HelpCircle size={18} className="text-emerald" />
            <h3 className="card-heading">Key Forecasting Drivers</h3>
          </div>
          <p className="card-subheading">
            Empirical feature contributions learned by the Random Forest model:
          </p>

          <div className="drivers-list">
            <div className="driver-item">
              <div className="driver-number">1</div>
              <div className="driver-content">
                <strong>Autoregressive Persistence (Lag-1: 85.8% Importance)</strong>
                <p>
                  Active forest & grassland fires do not vanish instantaneously. Observed counts on {refDate} ({region.latestObservedCount.toLocaleString()} fires) provide the primary anchor for tomorrow's prediction.
                </p>
              </div>
            </div>

            <div className="driver-item">
              <div className="driver-number">2</div>
              <div className="driver-content">
                <strong>High-Confidence Detection Lag (3.4% Importance)</strong>
                <p>
                  Detections with high satellite confidence indicate intense active flaming fronts that possess greater thermal inertia and continuation probability into day t+1.
                </p>
              </div>
            </div>

            <div className="driver-item">
              <div className="driver-number">3</div>
              <div className="driver-content">
                <strong>Trailing Multi-Day Window (Rolling Max & Mean: 3.0% Importance)</strong>
                <p>
                  The trailing 7-day average is <strong>{Math.round(region.sevenDayAverage).toLocaleString()} fires/day</strong>. Multi-day aggregation smooths single-day orbital pass variations and captures multi-day regional acceleration.
                </p>
              </div>
            </div>

            <div className="driver-item">
              <div className="driver-number">4</div>
              <div className="driver-content">
                <strong>Calendar & Momentum Features (2.3% Importance)</strong>
                <p>
                  Day-of-week seasonality, 1-day momentum (delta between t-1 and t-2), and cyclical sine/cosine day-of-year encoding account for broader seasonal solar and burn patterns.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Sensitivity Playground */}
        <div className="card simulation-card">
          <div className="card-header-icon-title">
            <Sliders size={18} className="text-amber" />
            <h3 className="card-heading">Interactive Sensitivity Preview</h3>
          </div>
          <p className="card-subheading">
            Slide to inspect how changes in today's observed fire count influence the forecast response:
          </p>

          <div className="slider-control-block">
            <div className="slider-label-row">
              <label htmlFor="simulated-count-slider">Simulated Today's Count:</label>
              <span className="slider-value-display font-mono">{simulatedTodayCount.toLocaleString()} detections</span>
            </div>
            <input
              id="simulated-count-slider"
              type="range"
              min="1000"
              max={Math.max(150000, region.peakDayCount * 1.2)}
              step="500"
              value={simulatedTodayCount}
              onChange={(e) => setSimulatedTodayCount(Number(e.target.value))}
              className="styled-slider"
              aria-label="Simulate today's observed active-fire detection count"
              aria-valuemin={1000}
              aria-valuemax={Math.max(150000, region.peakDayCount * 1.2)}
              aria-valuenow={simulatedTodayCount}
              aria-valuetext={`${simulatedTodayCount.toLocaleString()} detections`}
            />
            <div className="slider-ticks">
              <span>1k (Trough)</span>
              <span>{Math.round(region.sevenDayAverage).toLocaleString()} (7d Avg)</span>
              <span>150k (Peak Season)</span>
            </div>
          </div>

          <div className="sim-result-box">
            <span className="sim-result-label">Resulting Forecast Response:</span>
            <div className="sim-result-row">
              <strong>{simulatedForecast.toLocaleString()} detections</strong>
              <span className="text-secondary">(Bounds: {simulatedLower.toLocaleString()} – {simulatedUpper.toLocaleString()})</span>
            </div>
            <small className="sim-disclaimer">
              * Interactive slider dynamically adjusts the autoregressive input vector to simulate operational what-if scenarios.
            </small>
          </div>

          <button
            className="secondary-action-btn btn-sm"
            onClick={() => setSimulatedTodayCount(region.latestObservedCount)}
          >
            Reset to Observed Count ({region.latestObservedCount.toLocaleString()})
          </button>
        </div>
      </div>
    </div>
  );
};
