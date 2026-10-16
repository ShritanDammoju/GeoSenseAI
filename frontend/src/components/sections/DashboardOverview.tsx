import type { RegionData, BackendHealth, TabType } from '../../types/dashboard';
import { StatCard } from '../StatCard';
import { ChartView } from '../ChartView';
import { 
  Flame, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

interface DashboardOverviewProps {
  region: RegionData;
  backendHealth: BackendHealth | null;
  backendLoading: boolean;
  onNavigateTab: (tab: TabType) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  region,
  backendHealth,
  backendLoading,
  onNavigateTab,
}) => {
  return (
    <div className="section-container dashboard-overview">
      {/* Intro Banner */}
      <div className="hero-card">
        <div className="hero-content">
          <div className="hero-badge">
            <Flame size={14} className="hero-flame-icon" />
            <span>Environmental Telemetry & Forecasting</span>
          </div>
          <h1 className="hero-title">GeoSense AI</h1>
          <p className="hero-subtitle">
            Forecasting next-day satellite-observed active-fire detection counts using historical NASA FIRMS data.
          </p>
          <p className="hero-description">
            Wildfires and thermal hotspot events exhibit distinct temporal persistence, spatial clustering, and seasonal acceleration.
            GeoSense AI aggregates daily satellite observations and models temporal dynamics to predict next-day fire counts across sensitive biomes.
          </p>
          
          <div className="hero-actions">
            <button className="primary-action-btn" onClick={() => onNavigateTab('forecast')}>
              <Sparkles size={16} />
              <span>Inspect Next-Day Forecast</span>
            </button>
            <button className="secondary-action-btn" onClick={() => onNavigateTab('models')}>
              <Layers size={16} />
              <span>Explore Model Lab</span>
            </button>
          </div>
        </div>

        {/* Selected Region Quick Summary */}
        <div className="region-highlight-card">
          <div className="region-header">
            <span className="region-meta-tag">Active Monitored Zone</span>
            {region.isAuthenticData ? (
              <span className="nasa-pill">AUTHENTIC NASA FIRMS</span>
            ) : (
              <span className="demo-pill">REGIONAL DEMO</span>
            )}
          </div>
          <h3 className="region-title">{region.name}</h3>
          <p className="region-biome"><strong>Biome / Scope:</strong> {region.biome}</p>
          <p className="region-coords"><strong>Footprint:</strong> {region.coordinatesApprox}</p>
          <p className="region-desc">{region.description}</p>
          <div className="region-latest-bar">
            <span>Latest Satellite Observation:</span>
            <strong>{region.latestObservedDate} {region.observationStatus === 'partial_or_near_real_time' ? '(Partial NRT)' : ''}</strong>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="kpi-grid">
        <StatCard
          label="Latest 24h Hotspot Count"
          value={region.latestObservedCount}
          unit="satellite detections"
          subtext={`Observed by NOAA-20 VIIRS on ${region.latestObservedDate}`}
          delta={region.twentyFourHourDelta}
          deltaLabel="vs previous day"
          variant="emerald"
          icon={<Flame size={18} />}
          isDemo={!region.isAuthenticData}
        />

        <StatCard
          label={region.isAuthenticData ? "Next-Day AI Forecast" : "Next-Day Forecast Baseline"}
          value={region.predictedNextDayCount}
          unit="forecasted detections"
          subtext={
            region.isAuthenticData
              ? `Target: ${region.targetForecastDate || '2026-10-16'} (${region.forecastModelName || 'Random Forest Regressor'}). Bounds: [${region.predictionRange[0]?.toLocaleString()} – ${region.predictionRange[1]?.toLocaleString()}]`
              : `Expected range: ${region.predictionRange[0]} – ${region.predictionRange[1]} detections`
          }
          delta={region.predictedNextDayCount - region.latestObservedCount}
          deltaLabel="vs today's count"
          variant="amber"
          icon={<Sparkles size={18} />}
          isDemo={!region.isAuthenticData}
        />

        <StatCard
          label="7-Day Rolling Average"
          value={Math.round(region.sevenDayAverage)}
          unit="detections / day"
          subtext="Weekly moving baseline smoothing sensor noise"
          variant="neutral"
          icon={<TrendingUp size={18} />}
          isDemo={!region.isAuthenticData}
        />

        <StatCard
          label={region.isAuthenticData ? "30-Day Peak Detection" : "Season Peak Detection"}
          value={region.peakDayCount}
          unit="hotspots"
          subtext={
            region.isAuthenticData
              ? `Highest detection spike observed in past 30 days`
              : "Highest single-day count observed in active window"
          }
          variant="neutral"
          icon={<ShieldAlert size={18} />}
          isDemo={!region.isAuthenticData}
        />
      </div>

      {/* Chart Section Preview */}
      <div className="overview-chart-section">
        <ChartView
          data={region.observations.slice(-14)}
          title={`Recent 14-Day Hotspot Trend — ${region.name}`}
          subtitle={
            region.isAuthenticData
              ? "Observed daily thermal hotspot counts from NOAA-20 VIIRS (NASA FIRMS) with 7-day rolling mean"
              : "Observed daily thermal hotspot counts (DEMO DATA) with 7-day rolling mean"
          }
          isAuthentic={region.isAuthenticData}
        />
        <div className="chart-view-more">
          <button className="text-link-btn" onClick={() => onNavigateTab('trends')}>
            <span>View Full Historical Trends & Data Controls</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* System & Data Pipeline Status Card */}
      <div className="status-overview-card">
        <div className="status-card-header">
          <div className="header-icon-title">
            <Info size={18} className="info-icon" />
            <h3>System Architecture & Telemetry Status</h3>
          </div>
          <span className="stage-badge">Stage 2: Frontend Design</span>
        </div>

        <div className="status-grid">
          <div className="status-item">
            <span className="status-title">Frontend Client</span>
            <div className="status-val-row">
              <CheckCircle2 size={16} className="text-emerald" />
              <span>React 19 + Vite + TypeScript (Active)</span>
            </div>
            <p className="status-note">Responsive environmental analytics UI.</p>
          </div>

          <div className="status-item">
            <span className="status-title">Python FastAPI Service</span>
            <div className="status-val-row">
              {backendLoading ? (
                <span className="text-amber">Checking local server...</span>
              ) : backendHealth ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Online (http://127.0.0.1:8000)</span>
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-amber" />
                  <span>Offline (Ready to start on port 8000)</span>
                </>
              )}
            </div>
            <p className="status-note">
              {backendHealth
                ? 'Health endpoint responding with status: healthy.'
                : 'Start with: .\\venv\\Scripts\\python.exe -m uvicorn app.main:app'}
            </p>
          </div>

          <div className="status-item">
            <span className="status-title">NASA FIRMS Pipeline</span>
            <div className="status-val-row">
              <span className="pending-pill">Stage 3 Integration</span>
            </div>
            <p className="status-note">
              Telemetry ingest pipeline will pull historical satellite observations in next stage.
            </p>
          </div>

          <div className="status-item">
            <span className="status-title">ML Forecasting Engine</span>
            <div className="status-val-row">
              <span className="pending-pill">Stage 3 Model Lab</span>
            </div>
            <p className="status-note">
              Persistence, Rolling Mean, and Random Forest regressors will be trained on historical data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
