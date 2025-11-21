import React from 'react';
import ReactApexChart from 'react-apexcharts';

/**
 * ApexChartWrapper - Wrapper seguro para ReactApexChart que valida datos antes de renderizar
 * Previene errores de parser cuando ApexCharts recibe datos inválidos
 */
const ApexChartWrapper = ({ options, series, type = 'line', height = 350, ...props }) => {
  // Validar que options sea un objeto válido
  if (!options || typeof options !== 'object') {
    console.error('[ApexChartWrapper] Invalid options provided:', options);
    return (
      <div className="d-flex align-items-center justify-content-center" style={{height}}>
        <p className="text-muted small">Error: Opciones de gráfico inválidas</p>
      </div>
    );
  }

  // Validar que series sea un array válido
  if (!Array.isArray(series) || series.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{height}}>
        <p className="text-muted small">No hay datos para mostrar</p>
      </div>
    );
  }

  // Validar cada serie
  const validSeries = series
    .filter(s => {
      if (!s || typeof s !== 'object') return false;
      if (!s.name || typeof s.name !== 'string') return false;
      if (!Array.isArray(s.data)) return false;
      if (s.data.length === 0) return false;
      
      // Validar cada punto de datos
      return s.data.every(d => {
        const value = typeof d === 'number' ? d : parseFloat(d);
        return isFinite(value) && value >= 0 && value < Number.MAX_SAFE_INTEGER;
      });
    })
    .map(s => ({
      name: String(s.name),
      data: s.data.map(d => {
        const value = typeof d === 'number' ? d : parseFloat(d);
        return isFinite(value) && value >= 0 ? value : 0;
      })
    }));

  if (validSeries.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{height}}>
        <p className="text-muted small">No hay datos válidos para mostrar</p>
      </div>
    );
  }

  // Validar y asegurar que las categorías coincidan con la longitud de los datos
  const maxDataLength = Math.max(...validSeries.map(s => s.data.length));
  const categories = options.xaxis?.categories || [];
  
  const safeOptions = {
    ...options,
    xaxis: {
      ...options.xaxis,
      categories: categories.length >= maxDataLength 
        ? categories.slice(0, maxDataLength)
        : [...categories, ...Array.from({ length: maxDataLength - categories.length }, (_, i) => `Item ${i + 1}`)]
    }
  };

  // Renderizar el gráfico
  return (
    <ReactApexChart
      options={safeOptions}
      series={validSeries}
      type={type}
      height={height}
      {...props}
    />
  );
};

export default ApexChartWrapper;

