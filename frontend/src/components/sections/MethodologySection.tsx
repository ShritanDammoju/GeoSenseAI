import React from 'react';
import { 
  BookOpen, 
  Satellite, 
  Layers, 
  Sparkles, 
  Target, 
  ArrowRight,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';

export const MethodologySection: React.FC = () => {
  return (
    <div className="section-container methodology-section">
      {/* Header */}
      <div className="section-header-block">
        <div>
          <div className="section-pill">
            <BookOpen size={14} />
            <span>Scientific Principles</span>
          </div>
          <h2 className="section-title">Methodology & System Architecture</h2>
          <p className="section-subtitle">
            How NASA satellite telemetry is transformed into daily wildfire hotspot forecasts explained in simple English.
          </p>
        </div>

        <span className="stage-badge">Methodology Guide</span>
      </div>

      {/* 4 Pillars Grid */}
      <div className="methodology-grid">
        {/* Pillar 1: NASA FIRMS */}
        <div className="card method-card">
          <div className="method-card-number">01</div>
          <div className="method-header-row">
            <Satellite size={20} className="text-emerald" />
            <h3 className="card-heading">What is NASA FIRMS?</h3>
          </div>
          <p className="method-text">
            <strong>FIRMS</strong> stands for <em>Fire Information for Resource Management System</em>. Satellites in Earth orbit carry thermal infrared cameras (like NASA's MODIS and VIIRS).
          </p>
          <p className="method-text">
            When a spot on the Earth's surface emits significantly higher heat energy than surrounding terrain, the satellite's algorithms detect an <strong>active thermal anomaly</strong> (wildfire, agricultural burn, or high-intensity heat).
          </p>
          <div className="method-key-takeaway">
            <CheckCircle2 size={14} className="text-emerald" />
            <span>Telemetry originates from real orbital sensors, not simulations.</span>
          </div>
        </div>

        {/* Pillar 2: Daily Aggregation */}
        <div className="card method-card">
          <div className="method-card-number">02</div>
          <div className="method-header-row">
            <Layers size={20} className="text-emerald" />
            <h3 className="card-heading">Spatial & Daily Aggregation</h3>
          </div>
          <p className="method-text">
            Satellites orbit around the planet continuously. To make sense of thousands of scattered points, we group them using two dimensions:
          </p>
          <ul className="method-list">
            <li>
              <strong>Spatial Bounding Box:</strong> We define a polygon over a region of interest (e.g. Northern Boreal Forest).
            </li>
            <li>
              <strong>Calendar Day (UTC):</strong> All fire points detected within that region during a 24-hour UTC window are counted.
            </li>
          </ul>
          <div className="method-key-takeaway">
            <CheckCircle2 size={14} className="text-emerald" />
            <span>Produces a single clean number: <em>Hotspot Detections per Day</em>.</span>
          </div>
        </div>

        {/* Pillar 3: Forecasting Problem */}
        <div className="card method-card">
          <div className="method-card-number">03</div>
          <div className="method-header-row">
            <Sparkles size={20} className="text-amber" />
            <h3 className="card-heading">The Forecasting Task</h3>
          </div>
          <p className="method-text">
            Wildfires exhibit strong <strong>temporal persistence</strong>: active fires usually continue burning the following day unless extinguished by rain or suppression efforts.
          </p>
          <p className="method-text">
            Our forecasting model performs <em>time-series regression</em>: given today's fire count, yesterday's count, and the trailing 7-day trend, predict <strong>tomorrow's total fire count</strong>.
          </p>
          <div className="method-key-takeaway">
            <CheckCircle2 size={14} className="text-amber" />
            <span>Provides actionable advance notice for environmental managers.</span>
          </div>
        </div>

        {/* Pillar 4: MAE Metric */}
        <div className="card method-card">
          <div className="method-card-number">04</div>
          <div className="method-header-row">
            <Target size={20} className="text-emerald" />
            <h3 className="card-heading">Why We Use MAE</h3>
          </div>
          <p className="method-text">
            <strong>MAE</strong> stands for <em>Mean Absolute Error</em>. In simple English:
          </p>
          <div className="formula-box font-mono">
            MAE = (1 / N) * Σ | Actual Count - Predicted Count |
          </div>
          <p className="method-text">
            For global forecasting, our held-out test set MAE is <strong>9,578 detections</strong> on a peak-season average of <strong>~75,900 fires/day</strong> (corresponding to ~12.8% MAPE).
          </p>
          <div className="method-key-takeaway">
            <CheckCircle2 size={14} className="text-emerald" />
            <span>Clear, honest units of measurement instead of fabricated percentages.</span>
          </div>
        </div>
      </div>

      {/* End-to-End Pipeline Visualization */}
      <div className="card pipeline-card">
        <div className="card-header-icon-title">
          <HelpCircle size={18} className="text-emerald" />
          <h3 className="card-heading">End-to-End Data Flow Pipeline (Stage 7 Integrated)</h3>
        </div>
        <p className="card-subheading">
          How data flows from orbit to this interactive frontend dashboard:
        </p>

        <div className="pipeline-flow">
          <div className="pipeline-step">
            <div className="step-circle">1</div>
            <h4>NASA Telemetry</h4>
            <p>NOAA-20 VIIRS 375m thermal anomaly detections in orbit</p>
          </div>

          <div className="pipeline-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="pipeline-step">
            <div className="step-circle">2</div>
            <h4>Chunked Ingest</h4>
            <p>Processed 220 raw CSVs (33.72M records) without memory overload</p>
          </div>

          <div className="pipeline-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="pipeline-step">
            <div className="step-circle">3</div>
            <h4>Daily Aggregator</h4>
            <p>Constructed 654 consecutive daily counts & 7d rolling statistics</p>
          </div>

          <div className="pipeline-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="pipeline-step">
            <div className="step-circle">4</div>
            <h4>FastAPI ML Engine</h4>
            <p>Random Forest Regressor & baselines with zero temporal leakage</p>
          </div>

          <div className="pipeline-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="pipeline-step">
            <div className="step-circle step-circle-active">5</div>
            <h4>React UI Dashboard</h4>
            <p>Live dashboard connected to backend endpoints (Stage 7)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
