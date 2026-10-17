import type { RegionData, BackendHealth, TabType, LiveFirmsPayload } from '../../types/dashboard';
import { StatCard } from '../StatCard';
import { ChartView } from '../ChartView';
import { LiveTelemetryCard } from '../LiveTelemetryCard';
import heroImage from '../../assets/earth_satellite_hero.jpg';
import { API_BASE_URL } from '../../config/api';
import { 
  Flame, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ShieldAlert, 
  Info,
  Satellite,
  ShieldCheck,
  MapPin,
  AlertCircle
} from 'lucide-react';

interface DashboardOverviewProps {
  region: RegionData;
  backendHealth: BackendHealth | null;
  backendLoading: boolean;
  onNavigateTab: (tab: TabType) => void;
  liveData?: LiveFirmsPayload | null;
  liveLoading?: boolean;
  liveError?: string | null;
  onRefreshLive?: (forceRefresh?: boolean) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  region,
  backendHealth,
  backendLoading,
  onNavigateTab,
  liveData = null,
  liveLoading = false,
  liveError = null,
  onRefreshLive = () => {},
}) => {
  return (
    <div className="section-container dashboard-overview">
      {/* Cinematic Earth Observation Satellite Hero Banner */}
      <div 
        className="hero-card with-satellite-bg"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(6, 17, 13, 0.90) 0%, rgba(10, 27, 21, 0.82) 45%, rgba(6, 17, 13, 0.94) 100%), url(${heroImage})`
        }}
      >
        <div className="hero-content">
          <div className="hero-badge-row">
            <div className="hero-badge">
              <Flame size={14} className="hero-flame-icon" />
              <span>NASA FIRMS Active Telemetry</span>
            </div>
            <div className="hero-sensor-badge">
              <Satellite size={13} className="hero-sensor-icon" />
              <span>VIIRS NOAA-20 (375m)</span>
            </div>
            <div className="hero-orbit-badge">
              <span className="hero-pulse-dot" />
              <span>Continuous Earth Observation</span>
            </div>
          </div>

          <h1 className="hero-title">
            GeoSense <span className="hero-title-accent">AI</span>
          </h1>
          <p className="hero-tagline">
            Next-Day Global Hotspot Forecasting via Satellite Thermal Radiance
          </p>
          <p className="hero-description">
            Wildfires and thermal hotspot events exhibit distinct temporal persistence, spatial clustering, and seasonal acceleration.
            GeoSense AI ingests 33.72M observations from the NOAA-20 VIIRS sensor (375m resolution), aggregates continuous daily global time-series, and fits leak-free forecasting models benchmarked against empirical baselines.
          </p>

          <div className="hero-key-stats">
            <div className="hero-stat-card">
              <span className="hero-stat-val">33.72M</span>
              <span className="hero-stat-lbl">Observations Ingested</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-card">
              <span className="hero-stat-val">654</span>
              <span className="hero-stat-lbl">Continuous Days</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-card">
              <span className="hero-stat-val">0</span>
              <span className="hero-stat-lbl">Missing Calendar Days</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat-card">
              <span className="hero-stat-val">375m</span>
              <span className="hero-stat-lbl">Nadir Resolution</span>
            </div>
          </div>
          
          <div className="hero-actions">
            <button className="primary-action-btn" onClick={() => onNavigateTab('forecast')}>
              <Sparkles size={16} />
              <span>Inspect Next-Day Forecast</span>
            </button>
            <button className="secondary-action-btn" onClick={() => onNavigateTab('models')}>
              <Layers size={16} />
              <span>Explore Model Lab</span>
            </button>
            <button className="tertiary-action-btn" onClick={() => onNavigateTab('quality')}>
              <ShieldCheck size={16} />
              <span>Data Provenance</span>
            </button>
          </div>
        </div>

        {/* Selected Region Quick Summary with Glassmorphism */}
        <div className="region-highlight-card glass-panel">
          <div className="region-header">
            <div className="region-header-left">
              <MapPin size={14} className="region-icon" />
              <span className="region-meta-tag">Active Monitored Zone</span>
            </div>
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
          {!region.isAuthenticData && (
            <div className="region-disclaimer-note">
              <AlertCircle size={13} className="text-amber" />
              <span>Simulated regional biome subset for demonstration. Select "Global Monitored Landmasses" for authentic NASA telemetry.</span>
            </div>
          )}
        </div>
      </div>

      {/* Real NASA FIRMS Live Telemetry Section */}
      <LiveTelemetryCard
        liveData={liveData}
        loading={liveLoading}
        error={liveError}
        onRefresh={onRefreshLive}
      />

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
                  <span>Online ({API_BASE_URL})</span>
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-amber" />
                  <span>Offline ({API_BASE_URL})</span>
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
              <CheckCircle2 size={16} className="text-emerald" />
              <span>{liveData ? 'Live Gateway Connected' : 'Stage 4 Pipeline Active'}</span>
            </div>
            <p className="status-note">
              {liveData
                ? `Streaming VIIRS NOAA-20 near-real-time observations via authentic MAP_KEY.`
                : `654 daily global aggregations processed from 33.72M records.`}
            </p>
          </div>

          <div className="status-item">
            <span className="status-title">ML Forecasting Engine</span>
            <div className="status-val-row">
              <CheckCircle2 size={16} className="text-emerald" />
              <span>Random Forest (Stage 5 Trained)</span>
            </div>
            <p className="status-note">
              Persistence, Rolling Mean, and Random Forest regressors evaluated chronologically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
