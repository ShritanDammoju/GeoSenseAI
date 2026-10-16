import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  delta?: number;
  deltaLabel?: string;
  variant?: 'emerald' | 'amber' | 'neutral';
  icon?: React.ReactNode;
  isDemo?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  subtext,
  delta,
  deltaLabel = 'vs previous 24h',
  variant = 'neutral',
  icon,
  isDemo = false,
}) => {
  return (
    <div className={`stat-card stat-card-${variant}`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-badges">
          {isDemo ? (
            <span className="demo-pill">DEMO</span>
          ) : (
            <span className="nasa-pill">NASA DATA</span>
          )}
          {icon && <span className="stat-card-icon">{icon}</span>}
        </div>
      </div>

      <div className="stat-card-main">
        <div className="stat-card-val-row">
          <span className="stat-card-value">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && <span className="stat-card-unit">{unit}</span>}
        </div>

        {delta !== undefined && (
          <div className={`delta-indicator ${delta > 0 ? 'delta-up' : delta < 0 ? 'delta-down' : 'delta-zero'}`}>
            {delta > 0 ? (
              <ArrowUpRight size={14} />
            ) : delta < 0 ? (
              <ArrowDownRight size={14} />
            ) : (
              <Minus size={14} />
            )}
            <span>
              {delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()} {deltaLabel}
            </span>
          </div>
        )}
      </div>

      {subtext && <p className="stat-card-subtext">{subtext}</p>}
    </div>
  );
};
