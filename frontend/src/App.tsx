import { useState, useEffect } from 'react';
import type { 
  TabType, 
  DateRangeOption, 
  ViewStateType, 
  BackendHealth, 
  RegionData,
  SummaryMetricsResponse,
  ProcessedDailyRecord,
  NextDayForecastPayload,
  LiveFirmsPayload
} from './types/dashboard';
import { DEMO_REGIONS } from './data/demoData';
import { Navbar } from './components/Navbar';
import { ControlsBar } from './components/ControlsBar';
import { StateFeedback } from './components/StateFeedback';
import { DashboardOverview } from './components/sections/DashboardOverview';
import { HistoricalTrends } from './components/sections/HistoricalTrends';
import { ForecastSection } from './components/sections/ForecastSection';
import { ModelLabSection } from './components/sections/ModelLabSection';
import { HotspotMapSection } from './components/sections/HotspotMapSection';
import { DataQualitySection } from './components/sections/DataQualitySection';
import { MethodologySection } from './components/sections/MethodologySection';
import { API_ENDPOINTS } from './config/api';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('region-global');
  const [dateRange, setDateRange] = useState<DateRangeOption>('14d');
  const [viewState, setViewState] = useState<ViewStateType>('normal');

  // Backend Health Integration
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [backendLoading, setBackendLoading] = useState<boolean>(false);

  // Authentic Processed NASA FIRMS Data
  const [authenticRegion, setAuthenticRegion] = useState<RegionData | null>(null);

  // Real NASA FIRMS Live Telemetry Stream
  const [liveFirmsData, setLiveFirmsData] = useState<LiveFirmsPayload | null>(null);
  const [liveLoading, setLiveLoading] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const fetchProcessedData = async () => {
    try {
      // 1. Fetch summary metrics
      const sumRes = await fetch(API_ENDPOINTS.timeSeriesSummary);
      if (!sumRes.ok) return;
      const summary: SummaryMetricsResponse = await sumRes.json();

      // 2. Fetch full global time series (all 654 days)
      const tsRes = await fetch(API_ENDPOINTS.timeSeriesGlobal);
      if (!tsRes.ok) return;
      const tsData = await tsRes.json();
      const records: ProcessedDailyRecord[] = tsData.records || [];

      if (records.length === 0) return;

      // 3. Fetch trained next-day forecast (Stage 5)
      let forecastPayload: NextDayForecastPayload | null = null;
      try {
        const fcRes = await fetch(API_ENDPOINTS.forecastNextDay);
        if (fcRes.ok) {
          forecastPayload = await fcRes.json();
        }
      } catch {
        // Fallback to baseline if not available
      }

      const predictedCount = forecastPayload?.forecast?.predicted_count_rounded ?? Math.round(summary.latest_complete_day.seven_day_moving_avg);
      const predictionRange: [number, number] = forecastPayload?.forecast
        ? [forecastPayload.forecast.lower_bound_approx, forecastPayload.forecast.upper_bound_approx]
        : [
            Math.round(summary.latest_complete_day.seven_day_moving_avg * 0.9),
            Math.round(summary.latest_complete_day.seven_day_moving_avg * 1.1)
          ];

      const realRegion: RegionData = {
        id: 'region-global',
        name: 'Global Monitored Landmasses (NASA FIRMS)',
        description: `Authentic daily time-series derived from ${summary.provenance.total_records_processed.toLocaleString()} satellite records (${summary.provenance.satellite} ${summary.provenance.instrument}). ${summary.provenance.total_consecutive_days} consecutive days processed.`,
        biome: 'Global Terrestrial & Maritime (NOAA-20)',
        coordinatesApprox: 'Global Extent [-89.1°S to 80.4°N, -180.0°W to 180.0°E]',
        latestObservedDate: summary.latest_complete_day.date,
        latestObservedCount: summary.latest_complete_day.detection_count,
        predictedNextDayCount: predictedCount,
        predictionRange: predictionRange,
        twentyFourHourDelta: summary.latest_complete_day.delta_24h,
        sevenDayAverage: Math.round(summary.latest_complete_day.seven_day_moving_avg),
        peakDayCount: summary.records_summary.peak_30d_count,
        targetForecastDate: forecastPayload?.forecast?.target_forecast_date ?? '2026-10-16',
        forecastModelName: forecastPayload ? 'Random Forest Regressor' : undefined,
        forecastConfidenceMAE: forecastPayload?.forecast?.confidence_band_mae,
        isAuthenticData: true,
        totalDetectionsAllTime: summary.records_summary.total_detections_sum,
        meanDailyFRP: summary.latest_complete_day.mean_frp_mw,
        observationStatus: summary.latest_observation.observation_status,
        sourceProduct: summary.latest_observation.source_product,
        observations: records.map((r) => ({
          date: r.date,
          count: r.detection_count,
          movingAverage7d: r.moving_avg_7d,
          satellite: 'VIIRS NOAA-20 (375m)',
          confidenceLevel: r.high_confidence_count > 0 ? 'High' : 'Nominal',
          cloudCoverEstimatePct: 0,
          meanFRP: r.mean_frp,
          totalFRP: r.total_frp,
          observationStatus: r.observation_status,
          sourceProduct: r.source_product
        }))
      };

      setAuthenticRegion(realRegion);
      setSelectedRegionId('region-global');
    } catch (err) {
      console.warn('Could not load authentic processed data from backend:', err);
    }
  };

  const fetchLiveFirmsData = async (forceRefresh = false, signal?: AbortSignal) => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const url = API_ENDPOINTS.firmsLive(1, forceRefresh);
      const resp = await fetch(url, { signal });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `Server responded with HTTP ${resp.status}`);
      }
      const data: LiveFirmsPayload = await resp.json();
      setLiveFirmsData(data);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Failed to reach NASA FIRMS live feed';
      setLiveError(msg);
      // Preserves last successful liveFirmsData so dashboard displays stale data rather than blanking
    } finally {
      setLiveLoading(false);
    }
  };

  const checkBackendHealth = async () => {
    setBackendLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.health);
      if (response.ok) {
        const data = await response.json();
        setBackendHealth(data);
        await Promise.all([fetchProcessedData(), fetchLiveFirmsData(false)]);
      } else {
        setBackendHealth(null);
      }
    } catch {
      setBackendHealth(null);
    } finally {
      setBackendLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const init = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.health, { signal: controller.signal });
        if (isMounted) {
          if (response.ok) {
            const data = await response.json();
            setBackendHealth(data);
            await Promise.all([
              fetchProcessedData(),
              fetchLiveFirmsData(false, controller.signal)
            ]);
          } else {
            setBackendHealth(null);
          }
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
        if (isMounted) setBackendHealth(null);
      }
    };
    init();

    // Automated live telemetry refresh every 30 minutes (respects backend 10-minute cache)
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;
    const intervalId = setInterval(() => {
      if (isMounted) {
        fetchLiveFirmsData(false);
      }
    }, THIRTY_MINUTES_MS);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(intervalId);
    };
  }, []);

  // Combined regions list: Authentic Global data first, followed by regional biomes
  const availableRegions: RegionData[] = authenticRegion
    ? [authenticRegion, ...DEMO_REGIONS]
    : DEMO_REGIONS;

  // Selected region object
  const currentRegion =
    availableRegions.find((r) => r.id === selectedRegionId) || availableRegions[0];

  return (
    <div className="geosense-root">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (viewState !== 'normal') setViewState('normal');
        }}
        backendHealth={backendHealth}
        backendLoading={backendLoading}
        onRefreshHealth={checkBackendHealth}
      />

      {/* Global Interactive Controls Bar */}
      <ControlsBar
        selectedRegionId={currentRegion.id}
        onRegionChange={setSelectedRegionId}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        viewState={viewState}
        onViewStateChange={setViewState}
        regions={availableRegions}
        isAuthentic={currentRegion.isAuthenticData ?? false}
      />

      {/* Main Content Viewport */}
      <main className="geosense-main">
        {viewState !== 'normal' ? (
          <StateFeedback
            state={viewState}
            onReset={() => setViewState('normal')}
          />
        ) : (
          <>
            {activeTab === 'overview' && (
              <DashboardOverview
                region={currentRegion}
                backendHealth={backendHealth}
                backendLoading={backendLoading}
                onNavigateTab={setActiveTab}
                liveData={liveFirmsData}
                liveLoading={liveLoading}
                liveError={liveError}
                onRefreshLive={fetchLiveFirmsData}
              />
            )}

            {activeTab === 'trends' && (
              <HistoricalTrends
                region={currentRegion}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            )}

            {activeTab === 'forecast' && (
              <ForecastSection region={currentRegion} />
            )}

            {activeTab === 'models' && <ModelLabSection />}

            {activeTab === 'map' && (
              <HotspotMapSection
                selectedRegion={currentRegion}
                onSelectRegion={setSelectedRegionId}
              />
            )}

            {activeTab === 'quality' && <DataQualitySection />}

            {activeTab === 'methodology' && <MethodologySection />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="geosense-footer">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-brand">GeoSense AI</span>
            <span className="footer-tag">
              {currentRegion.isAuthenticData 
                ? 'Stage 4 Pipeline Active • Authentic NOAA-20 VIIRS Telemetry' 
                : 'Stage 4 Ingestion Connected • Regional Preview'}
            </span>
          </div>
          <div className="footer-right">
            <p>
              Forecasting satellite-observed active-fire counts using historical NASA FIRMS data.
            </p>
            <p className="footer-disclaimer">
              {currentRegion.isAuthenticData
                ? 'Dataset: 33,723,945 satellite records from NASA FIRMS VIIRS (NOAA-20 / JPSS-1) processed across 654 consecutive days.'
                : 'Notice: Regional biomes display simulated preview bounds. Authentic global telemetry is available under "Global Monitored Landmasses".'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
