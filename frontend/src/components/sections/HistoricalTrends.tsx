import React, { useState } from 'react';
import type { RegionData, DateRangeOption } from '../../types/dashboard';
import { ChartView } from '../ChartView';
import { StatCard } from '../StatCard';
import { 
  Calendar, 
  Satellite, 
  Filter, 
  BarChart2, 
  Zap,
  ShieldCheck
} from 'lucide-react';

interface HistoricalTrendsProps {
  region: RegionData;
  dateRange: DateRangeOption;
  onDateRangeChange: (range: DateRangeOption) => void;
}

export const HistoricalTrends: React.FC<HistoricalTrendsProps> = ({
  region,
  dateRange,
  onDateRangeChange,
}) => {
  const [satelliteFilter, setSatelliteFilter] = useState<'All' | 'VIIRS' | 'MODIS'>('All');

  // Slice observations based on chosen dateRange
  const daysCount = 
    dateRange === '7d' ? 7 :
    dateRange === '14d' ? 14 :
    dateRange === '30d' ? 30 :
    dateRange === '60d' ? 60 :
    region.observations.length;

  const filteredObservations = region.observations.slice(-daysCount);

  // Period calculations
  const totalCount = filteredObservations.reduce((acc, curr) => acc + curr.count, 0);
  const avgCount = Math.round(totalCount / (filteredObservations.length || 1));
  const maxObservation = filteredObservations.reduce(
    (max, curr) => (curr.count > max.count ? curr : max),
    filteredObservations[0] || { count: 0, date: 'N/A' }
  );

  const meanFRPPeriod = 
    filteredObservations.length > 0 && filteredObservations[0].meanFRP !== undefined
      ? (filteredObservations.reduce((acc, curr) => acc + (curr.meanFRP || 0), 0) / filteredObservations.length).toFixed(1)
      : null;

  const highConfidenceCount = filteredObservations.filter(
    (d) => d.confidenceLevel === 'High'
  ).length;

  const displayedList = filteredObservations.filter((obs) => {
    if (satelliteFilter === 'VIIRS') return obs.satellite.includes('VIIRS');
    if (satelliteFilter === 'MODIS') return obs.satellite.includes('MODIS');
    return true;
  });

  return (
    <div className="section-container historical-trends">
      {/* Section Header */}
      <div className="section-header-block">
        <div>
          <div className="section-pill">
            <BarChart2 size={14} />
            <span>Time-Series Telemetry</span>
          </div>
          <h2 className="section-title">Historical Hotspot Activity Trends</h2>
          <p className="section-subtitle">
            Daily satellite-observed active-fire counts across <strong>{region.name}</strong>.
          </p>
        </div>

        {/* Date Window Buttons */}
        <div className="trends-controls-group">
          <span className="control-caption">Window:</span>
          <div className="segmented-control">
            <button
              className={`segment-btn ${dateRange === '7d' ? 'active' : ''}`}
              onClick={() => onDateRangeChange('7d')}
            >
              7d
            </button>
            <button
              className={`segment-btn ${dateRange === '14d' ? 'active' : ''}`}
              onClick={() => onDateRangeChange('14d')}
            >
              14d
            </button>
            <button
              className={`segment-btn ${dateRange === '30d' ? 'active' : ''}`}
              onClick={() => onDateRangeChange('30d')}
            >
              30d
            </button>
            <button
              className={`segment-btn ${dateRange === '60d' ? 'active' : ''}`}
              onClick={() => onDateRangeChange('60d')}
            >
              60d
            </button>
            <button
              className={`segment-btn ${dateRange === 'all' ? 'active' : ''}`}
              onClick={() => onDateRangeChange('all')}
            >
              All ({region.observations.length}d)
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="kpi-grid">
        <StatCard
          label={`Total Detected Hotspots (${filteredObservations.length}d)`}
          value={totalCount}
          unit="fire observations"
          subtext={`Sum of all spatial cluster observations across ${filteredObservations.length} days`}
          variant="emerald"
          icon={<BarChart2 size={16} />}
          isDemo={!region.isAuthenticData}
        />

        <StatCard
          label="Daily Average Detection Rate"
          value={avgCount}
          unit="fires / day"
          subtext={`Mean daily frequency across ${filteredObservations.length}-day window`}
          variant="neutral"
          icon={<Calendar size={16} />}
          isDemo={!region.isAuthenticData}
        />

        <StatCard
          label="Single-Day Peak Spike"
          value={maxObservation.count}
          unit="fires"
          subtext={`Recorded on ${maxObservation.date}`}
          variant="amber"
          icon={<Satellite size={16} />}
          isDemo={!region.isAuthenticData}
        />

        {meanFRPPeriod ? (
          <StatCard
            label="Mean Fire Radiative Power"
            value={meanFRPPeriod}
            unit="Megawatts (MW)"
            subtext="Radiant heat energy per detection (NOAA-20 VIIRS)"
            variant="neutral"
            icon={<Zap size={16} />}
            isDemo={!region.isAuthenticData}
          />
        ) : (
          <StatCard
            label="High-Confidence Sensor Passes"
            value={`${Math.round((highConfidenceCount / (filteredObservations.length || 1)) * 100)}%`}
            unit="nominal/high"
            subtext={`${highConfidenceCount} of ${filteredObservations.length} days recorded with high sensor certainty`}
            variant="neutral"
            icon={<ShieldCheck size={16} />}
            isDemo={!region.isAuthenticData}
          />
        )}
      </div>

      {/* Primary Trend Chart */}
      <div className="card chart-full-card">
        <ChartView
          data={filteredObservations}
          title={`Daily Hotspot Time-Series (${filteredObservations.length}-Day Span)`}
          subtitle={`Green: Daily Count | Amber Dashed: 7-Day Rolling Baseline | Hover to inspect values`}
          height={320}
          isAuthentic={region.isAuthenticData}
        />
      </div>

      {/* Daily Records Data Table */}
      <div className="card table-card">
        <div className="table-header-row">
          <div>
            <h3 className="card-heading">Daily Telemetry Log</h3>
            <p className="card-subheading">
              Individual daily aggregated sensor records for {region.name} (
              {region.isAuthenticData ? 'AUTHENTIC NASA FIRMS DATA' : 'DEMO DATA'})
            </p>
          </div>

          <div className="table-filter-group">
            <Filter size={14} className="filter-icon" />
            <span className="filter-label">Filter Sensor:</span>
            <select
              className="control-select mini-select"
              value={satelliteFilter}
              onChange={(e) => setSatelliteFilter(e.target.value as 'All' | 'VIIRS' | 'MODIS')}
            >
              <option value="All">All Sensors</option>
              <option value="VIIRS">VIIRS Only</option>
              <option value="MODIS">MODIS Only</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="telemetry-table">
            <thead>
              <tr>
                <th>Observation Date</th>
                <th>Observed Hotspots</th>
                <th>7-Day Rolling Mean</th>
                <th>Instrument / Satellite</th>
                {region.isAuthenticData ? (
                  <>
                    <th>Mean FRP (MW)</th>
                    <th>Observation Status</th>
                  </>
                ) : (
                  <>
                    <th>Confidence Class</th>
                    <th>Estimated Cloud Obscuration</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {displayedList.slice().reverse().slice(0, 100).map((obs) => (
                <tr key={obs.date}>
                  <td className="font-mono">{obs.date}</td>
                  <td>
                    <span className="count-badge">{obs.count.toLocaleString()} fires</span>
                  </td>
                  <td className="text-secondary font-mono">
                    {obs.movingAverage7d ? Math.round(obs.movingAverage7d).toLocaleString() : '—'}
                  </td>
                  <td>
                    <span className="sensor-tag">{obs.satellite}</span>
                  </td>
                  {region.isAuthenticData ? (
                    <>
                      <td className="font-mono text-emerald">{obs.meanFRP ? `${obs.meanFRP} MW` : '—'}</td>
                      <td>
                        <span
                          className={`confidence-tag ${
                            obs.observationStatus === 'complete' ? 'conf-high' : 'conf-nominal'
                          }`}
                        >
                          {obs.observationStatus === 'complete' ? 'Complete (24h)' : 'Partial NRT'}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <span
                          className={`confidence-tag ${
                            obs.confidenceLevel === 'High' ? 'conf-high' : 'conf-nominal'
                          }`}
                        >
                          {obs.confidenceLevel}
                        </span>
                      </td>
                      <td>
                        <div className="cloud-bar-wrapper">
                          <div
                            className="cloud-bar-fill"
                            style={{ width: `${obs.cloudCoverEstimatePct}%` }}
                          ></div>
                          <span className="cloud-text">{obs.cloudCoverEstimatePct}%</span>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
