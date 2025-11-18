import React from 'react';

/**
 * StatCard - card simple para KPIs
 * Props:
 *  - title
 *  - value
 *  - subtitle?
 *  - delta? (var porcentaje)
 *  - deltaDirection?: 'up' | 'down'
 *  - icon?: ReactNode
 *  - color?: bootstrap contextual color (primary, success, etc)
 */
const StatCard = ({ title, value, subtitle, delta, deltaDirection, icon, color = 'primary' }) => {
  const deltaClass = deltaDirection === 'up' ? 'text-success' : deltaDirection === 'down' ? 'text-danger' : 'text-muted';
  return (
    <div className="card h-100">
      <div className="card-body d-flex flex-column justify-content-between py-2">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <div>
            <div className="text-muted small text-uppercase fw-semibold">{title}</div>
          </div>
          {icon && <div className={`bg-${color} bg-opacity-10 text-${color} p-2 rounded`}>{icon}</div>}
        </div>
        <div>
          <div className="h5 mb-0">{value}</div>
          {subtitle && <div className="small text-muted">{subtitle}</div>}
          {delta !== undefined && (
            <div className={`small ${deltaClass}`}>{deltaDirection === 'up' ? '▲' : deltaDirection === 'down' ? '▼' : ''} {delta}%</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
