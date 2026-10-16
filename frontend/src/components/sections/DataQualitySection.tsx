import React, { useState, useEffect } from 'react';
import type { DataQualityAuditPayload } from '../../types/dashboard';
import { 
  ShieldCheck, 
  Satellite, 
  AlertTriangle, 
  CloudRain,
  Database,
  CalendarCheck,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export const DataQualitySection: React.FC = () => {
  const [auditData, setAuditData] = useState<DataQualityAuditPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/data-quality')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data: DataQualityAuditPayload) => {
        if (data && data.status === 'success') {
          setAuditData(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load data quality audit:', err);
        setError('Backend data quality endpoint unavailable. Running in offline mode.');
      });
  }, []);

  const prov = auditData?.provenance;

  return (
    <div className="section-container data-quality-section">
      {/* Header */}
      <div className="section-header-block">
        <div>
          <div className="section-pill">
            <ShieldCheck size={14} />
            <span>Telemetry Integrity & Limitations (Stage 4 & 5 Audit)</span>
          </div>
          <h2 className="section-title">Data Quality, Sensors & Operational Limitations</h2>
          <p className="section-subtitle">
            Transparent documentation of NASA FIRMS satellite telemetry, verified observation continuity, and operational constraints.
          </p>
        </div>

        <span className="nasa-pill">
          <ShieldCheck size={12} />
          VERIFIED PIPELINE AUDIT
        </span>
      </div>

      {error && (
        <div className="card disclaimer-card mb-4">
          <div className="disclaimer-header">
            <AlertCircle size={16} className="text-amber" />
            <strong>Connection Notice</strong>
          </div>
          <p className="disclaimer-body">{error}</p>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="kpi-grid mb-4">
        <div className="stat-card stat-card-emerald">
          <div className="stat-card-header">
            <span className="stat-label">Total Records Ingested</span>
            <div className="stat-icon-badge bg-emerald-glow text-emerald">
              <Database size={18} />
            </div>
          </div>
          <div className="stat-value-container">
            <span className="stat-value font-mono">
              {prov ? prov.total_records_processed.toLocaleString() : '33,723,945'}
            </span>
            <span className="stat-unit">raw detections</span>
          </div>
          <div className="stat-subtext">Across {prov ? prov.total_files_processed : 220} validated NASA FIRMS CSV files</div>
        </div>

        <div className="stat-card stat-card-emerald">
          <div className="stat-card-header">
            <span className="stat-label">Temporal Coverage Continuity</span>
            <div className="stat-icon-badge bg-emerald-glow text-emerald">
              <CalendarCheck size={18} />
            </div>
          </div>
          <div className="stat-value-container">
            <span className="stat-value font-mono">
              {prov ? prov.consecutive_days_span : 654}
            </span>
            <span className="stat-unit">consecutive days</span>
          </div>
          <div className="stat-subtext">
            {prov?.date_range.start || '2025-01-01'} to {prov?.date_range.end || '2026-10-16'} (<strong>0 missing days</strong>)
          </div>
        </div>

        <div className="stat-card stat-card-neutral">
          <div className="stat-card-header">
            <span className="stat-label">Observation Status Breakdown</span>
            <div className="stat-icon-badge text-emerald">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value-container">
            <span className="stat-value font-mono">
              {prov ? prov.complete_days_count : 653} / {prov ? prov.consecutive_days_span : 654}
            </span>
            <span className="stat-unit">complete days</span>
          </div>
          <div className="stat-subtext">
            1 partial NRT day ({prov?.partial_date || '2026-10-16'}: {prov ? prov.partial_detections.toLocaleString() : '16,952'} detections)
          </div>
        </div>

        <div className="stat-card stat-card-amber">
          <div className="stat-card-header">
            <span className="stat-label">Telemetry Deduplication</span>
            <div className="stat-icon-badge bg-amber-glow text-amber">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="stat-value-container">
            <span className="stat-value font-mono">100%</span>
            <span className="stat-unit">NOAA-20 VIIRS</span>
          </div>
          <div className="stat-subtext">
            Pure single-sensor isolation; zero mixing with NOAA-21 or MODIS
          </div>
        </div>
      </div>

      {/* Sensor Comparison Grid */}
      <div className="grid-2col mb-4">
        {/* Sensor 1: VIIRS NOAA-20 (Primary Sensor) */}
        <div className="card sensor-card">
          <div className="sensor-card-header">
            <div className="sensor-icon-badge">
              <Satellite size={20} className="text-emerald" />
            </div>
            <div>
              <h3 className="sensor-name">VIIRS (Visible Infrared Imaging Radiometer Suite)</h3>
              <p className="sensor-satellites">Platform: NOAA-20 (JPSS-1) • NASA FIRMS 375m Telemetry</p>
            </div>
          </div>

          <div className="sensor-specs-list">
            <div className="spec-row">
              <span className="spec-label">Spatial Resolution:</span>
              <strong className="spec-value font-mono text-emerald">375 meters at nadir (I-Bands)</strong>
            </div>
            <div className="spec-row">
              <span className="spec-label">Spectral Channels:</span>
              <span className="spec-value font-mono">I4 (3.74–3.96 μm) & I5 (11.0–12.0 μm)</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Observation Frequency:</span>
              <span className="spec-value">~2 daytime + 2 nighttime passes / 24h</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Processing Version:</span>
              <span className="spec-value font-mono">VNP14IMGTDL (Archive) & VNP14IMGT_NRT (NRT)</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Primary Advantage:</span>
              <span className="spec-value text-emerald">Detects smaller, lower-temperature smoldering fires earlier</span>
            </div>
          </div>
        </div>

        {/* Ingested File Breakdown */}
        <div className="card sensor-card">
          <div className="sensor-card-header">
            <div className="sensor-icon-badge">
              <FileSpreadsheet size={20} className="text-amber" />
            </div>
            <div>
              <h3 className="sensor-name">Ingested Raw Data Partition Architecture</h3>
              <p className="sensor-satellites">Verified in Stage 3 & Processed in Stage 4</p>
            </div>
          </div>

          <div className="sensor-specs-list">
            <div className="spec-row">
              <span className="spec-label">2025 Sovereign Archive:</span>
              <span className="spec-value font-mono">217 country CSVs • 18,377,294 detections</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">2026 H1 Global Archive:</span>
              <span className="spec-value font-mono">1 CSV (Jan 1 – Jun 30) • 7,386,419 detections</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">2026 H2 Near-Real-Time:</span>
              <span className="spec-value font-mono">2 CSVs (Jul 1 – Oct 16) • 7,960,232 detections</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Overlapping Records:</span>
              <span className="spec-value text-emerald">0 duplicates (clean boundary on 2026-06-30 / 07-01)</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Data Storage Mode:</span>
              <span className="spec-value font-mono">Memory-efficient chunked streaming (100k chunksize)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Missing-Day & Cloud Handling Protocol */}
      <div className="card mb-4">
        <div className="card-header-icon-title">
          <CloudRain size={20} className="text-emerald" />
          <h3 className="card-heading">Missing-Day & Observation Lag Protocol</h3>
        </div>
        <p className="card-subheading">
          How the GeoSense AI pipeline handles temporal integrity and avoids data corruption:
        </p>

        <div className="quality-steps-grid">
          <div className="quality-step-item">
            <div className="step-badge">Phase 1</div>
            <h4>Continuous Calendar Verification</h4>
            <p>
              Daily dates were verified sequentially. Across 654 consecutive calendar days from 2025-01-01 to 2026-10-16, exactly 0 missing dates were discovered.
            </p>
          </div>

          <div className="quality-step-item">
            <div className="step-badge">Phase 2</div>
            <h4>Near-Real-Time Downlink Separation</h4>
            <p>
              The most recent date (2026-10-16) contains only partial telemetry (16,952 fires). The pipeline tags it as <code>partial_or_near_real_time</code> and anchors forecasting on 2026-10-15 (the latest complete day).
            </p>
          </div>

          <div className="quality-step-item">
            <div className="step-badge">Phase 3</div>
            <h4>Zero Imputation Without Fabrication</h4>
            <p>
              No artificial zero counts or fabricated detections were injected. The 7-day rolling average and lag features are derived strictly from observed satellite passes.
            </p>
          </div>
        </div>
      </div>

      {/* Limitations & Real-World Boundaries */}
      <div className="card limitations-card">
        <div className="card-header-icon-title">
          <AlertTriangle size={20} className="text-amber" />
          <h3 className="card-heading">Physical Telemetry Limitations & Constraints</h3>
        </div>
        <p className="card-subheading">
          Documented limitations derived from NASA FIRMS validation reports:
        </p>

        <div className="limitations-grid">
          <div className="limitation-item">
            <strong>1. Sun-Synchronous Orbit Cadence (Not 24/7 Video)</strong>
            <p>
              NOAA-20 passes overhead in a polar sun-synchronous orbit (~1:30 PM local daytime ascending, ~1:30 AM local nighttime descending). Rapid flash fires that ignite and burn out between passes cannot be observed.
            </p>
          </div>

          <div className="limitation-item">
            <strong>2. Cloud & Smoke Attenuation</strong>
            <p>
              Thick convective cloud decks and dense pyrocumulonimbus smoke plumes attenuate surface infrared radiation, temporarily shielding active fires from satellite detectors.
            </p>
          </div>

          <div className="limitation-item">
            <strong>3. Industrial & Static Thermal Anomaly Filtering</strong>
            <p>
              Gas flares in petroleum fields, steel foundries, and volcanic vents register as thermal anomalies. The pipeline aggregates sovereign and terrestrial landmasses to capture macro wildfire trends.
            </p>
          </div>

          <div className="limitation-item">
            <strong>4. Sub-Canopy Smoldering Fires</strong>
            <p>
              In dense tropical peat or heavy boreal duff, ground fires can smolder beneath dense canopies without reaching the thermal radiance threshold required for satellite detection until crowning occurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
