import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTradingData } from '../context/HyperliquidTradingProvider';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { useCandles } from '../../../../hooks/useCandles.js';
import './ChartWrapper.css';

const ChartWrapper = () => {
  const { selectedSymbol, tickers } = useTradingData();
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  // Filtros personalizados
  const [timeframe, setTimeframe] = useState('1h'); // '1m' | '5m' | '15m' | '1h'
  const [length, setLength] = useState(200);       // número de velas
  const [showVolume, setShowVolume] = useState(true);
  const [autoFitActive, setAutoFitActive] = useState(false);
  
  // get coin id from symbol
  const coinId = selectedSymbol && selectedSymbol.includes('/') 
    ? selectedSymbol.split('/')[0].toLowerCase() 
    : (selectedSymbol || 'btc').toLowerCase();
  
  // fetch real candles from hyperliquid
  const { candles: realCandles, loading: candlesLoading } = useCandles(coinId, timeframe, length);

  const rebuildData = useCallback(() => {
    if (!seriesRef.current || !realCandles || realCandles.length === 0) {
      return;
    }
    
    try {
      // Validate and filter candles before setting data
      const validCandles = realCandles.filter(c => {
        if (!c || typeof c !== 'object') return false;
        
        // Validate time (must be a number and reasonable timestamp)
        const time = c.time;
        if (typeof time !== 'number' || time <= 0 || time > 2147483647) {
          return false; // Invalid timestamp (max 32-bit Unix timestamp)
        }
        
        // Validate OHLC values
        const open = typeof c.open === 'number' ? c.open : parseFloat(c.open);
        const high = typeof c.high === 'number' ? c.high : parseFloat(c.high);
        const low = typeof c.low === 'number' ? c.low : parseFloat(c.low);
        const close = typeof c.close === 'number' ? c.close : parseFloat(c.close);
        
        if (!isFinite(open) || !isFinite(high) || !isFinite(low) || !isFinite(close)) {
          return false;
        }
        
        if (open <= 0 || high <= 0 || low <= 0 || close <= 0) {
          return false;
        }
        
        // Validate OHLC relationships
        if (high < low || high < open || high < close || low > open || low > close) {
          return false;
        }
        
        return true;
      }).map(c => ({
        time: c.time,
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close)
      }));
      
      if (validCandles.length === 0) {
        console.warn('[ChartWrapper] No valid candles to display after filtering');
        return;
      }
      
      // use real candles from hyperliquid
      seriesRef.current.setData(validCandles);
      
      if (showVolume && volumeSeriesRef.current) {
        // calculate volume from price movement (since hyperliquid candles don't include volume in this format)
        const volData = validCandles.map(c => {
          const volume = Math.abs(c.close - c.open) * (c.high - c.low) * 1000; // approximate volume
          return {
            time: c.time,
            value: Math.max(1, Math.round(volume)),
            color: c.close >= c.open ? '#16a34a99' : '#dc262699'
          };
        });
        volumeSeriesRef.current.setData(volData);
      } else if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData([]);
      }
      
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error('[ChartWrapper] Error setting chart data:', error);
      // Don't throw, just log the error
    }
  }, [realCandles, showVolume]);

  // Initialize chart (only once) - with comprehensive cleanup
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isMounted = true;
    let chartInstance = null;
    let seriesInstance = null;
    let volumeSeriesInstance = null;

    // Crear chart una sola vez
    if (!chartRef.current && isMounted) {
      try {
        chartInstance = createChart(el, {
          layout: { background: { color: '#ffffff' }, textColor: '#222' },
          grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { visible: true },
          timeScale: { timeVisible: true, secondsVisible: false },
          localization: { locale: 'en-US' },
          // autoSize desactivado para evitar loop con ResizeObserver manual
        });
        
        if (isMounted) {
          seriesInstance = chartInstance.addCandlestickSeries({
            upColor: '#16a34a', downColor: '#dc2626', borderVisible: false, wickUpColor: '#16a34a', wickDownColor: '#dc2626'
          });
          volumeSeriesInstance = chartInstance.addHistogramSeries({
            priceScaleId: '',
            priceFormat: { type: 'volume' },
            scaleMargins: { top: 0.8, bottom: 0 },
            color: '#888'
          });
          
          chartRef.current = chartInstance;
          seriesRef.current = seriesInstance;
          volumeSeriesRef.current = volumeSeriesInstance;
        } else {
          // Componente desmontado antes de inicializar, limpiar
          try {
            chartInstance?.remove();
          } catch (e) {
            // Ignorar errores de cleanup
          }
        }
      } catch (error) {
        console.error('[ChartWrapper] Error creating chart:', error);
        // Asegurar limpieza en caso de error
        try {
          chartInstance?.remove();
        } catch (e) {
          // Ignorar errores de cleanup
        }
      }
    }

    // Cleanup function - comprehensive cleanup on unmount
    return () => {
      isMounted = false;
      
      // Limpiar refs primero
      const chart = chartRef.current;
      const series = seriesRef.current;
      const volumeSeries = volumeSeriesRef.current;
      
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      
      // Limpiar instancias
      if (volumeSeries) {
        try {
          // lightweight-charts maneja la limpieza automáticamente
        } catch (e) {
          console.warn('[ChartWrapper] Error cleaning volume series:', e);
        }
      }
      
      if (series) {
        try {
          // lightweight-charts maneja la limpieza automáticamente
        } catch (e) {
          console.warn('[ChartWrapper] Error cleaning series:', e);
        }
      }
      
      if (chart) {
        try {
          chart.remove();
        } catch (e) {
          console.warn('[ChartWrapper] Error removing chart:', e);
        }
      }
      
      // Limpiar el contenedor también
      if (el && el.firstChild) {
        try {
          while (el.firstChild) {
            el.removeChild(el.firstChild);
          }
        } catch (e) {
          console.warn('[ChartWrapper] Error cleaning container:', e);
        }
      }
    };
  }, []);

  // Update data when candles change
  useEffect(() => {
    if (!realCandles || realCandles.length === 0) return;
    rebuildData();
  }, [selectedSymbol, realCandles, rebuildData]);

  // Resize observer optimizado para evitar 'ResizeObserver loop'
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chartRef.current) return;
    let frame = null;
    let last = { w: 0, h: 0 };
    const resize = (width, height) => {
      if (!chartRef.current) return;
      if (width === last.w && height === last.h) return; // evitar reentradas innecesarias
      last = { w: width, h: height };
      chartRef.current.applyOptions({ width, height });
    };
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => resize(Math.floor(width), Math.floor(height)));
    });
    observer.observe(el);
    // inicial
    resize(el.clientWidth, el.clientHeight);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  // update chart when new candles arrive (refresh every minute for real-time updates)
  useEffect(() => {
    if (!realCandles || realCandles.length === 0) return;
    
    const id = setInterval(() => {
      if (!seriesRef.current) return;
      // rebuild data to get latest candles
      rebuildData();
    }, 60000); // refresh every minute
    
    return () => clearInterval(id);
  }, [selectedSymbol, timeframe, rebuildData, realCandles]);

  // Re-generar dataset cuando cambian filtros manuales
  useEffect(() => {
    const baseTicker = tickers.find(t => t.symbol === selectedSymbol) || tickers[0];
    if (baseTicker) rebuildData();
  }, [timeframe, length, showVolume, rebuildData, selectedSymbol, tickers]);

  // Este useEffect está duplicado - ya está manejado en el useEffect de inicialización

  const handleLengthChange = (e) => setLength(parseInt(e.target.value,10));

  const handleAutoFit = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
      setAutoFitActive(true);
      setTimeout(() => setAutoFitActive(false), 1000);
    }
  };

  return (
      <div className="card h-100" style={{borderRadius:22}}>
        <div className="card-header d-flex flex-wrap gap-3 align-items-center" style={{borderTopLeftRadius:22, borderTopRightRadius:22, padding:'10px 18px'}}>
          <h6 className="mb-0 fw-semibold" style={{letterSpacing:'.4px'}}>Chart</h6>
          <div className="d-flex align-items-center gap-2 small">
            {['1m','5m','15m','1h'].map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)} className={`btn btn-sm ${tf===timeframe?'btn-primary':'btn-outline-secondary'}`} style={{padding:'2px 10px', borderRadius:18}}>{tf}</button>
            ))}
          </div>
          <div className="d-flex align-items-center gap-2 small">
            <select value={length} onChange={handleLengthChange} className="form-select form-select-sm" style={{width:90, borderRadius:14}}>
              {[120,240,360,480,720].map(n => <option key={n} value={n}>{n} velas</option>)}
            </select>
            <button onClick={() => setShowVolume(v=>!v)} className={`btn btn-sm ${showVolume?'btn-secondary':'btn-outline-secondary'}`} style={{borderRadius:18}}>
              Vol {showVolume?'On':'Off'}
            </button>
            <button 
              onClick={handleAutoFit} 
              className={`btn btn-sm ${autoFitActive ? 'btn-success' : 'btn-outline-secondary'}`} 
              style={{borderRadius:18, transition: 'all 0.3s ease'}}
              title="Ajusta el gráfico para ver todas las velas"
            >
              {autoFitActive ? '✓ Ajustado' : '⇄ Auto-Fit'}
            </button>
          </div>
          <div className="ms-auto d-flex align-items-center gap-2">
            {/* Real-time indicator */}
            {!candlesLoading && realCandles.length > 0 && (
              <div className="chart-live-indicator">
                <span className="live-dot"></span>
                <span className="live-text">LIVE</span>
              </div>
            )}
          </div>
        </div>
        <div className="card-body" style={{height:'100%', padding:'14px 18px 18px', display:'flex', flexDirection:'column'}}>
          <div style={{flex:1, position:'relative', borderRadius:18, background:'#ffffff', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.4), 0 0 0 1px rgba(0,0,0,0.05)', overflow:'hidden'}}>
            <div ref={containerRef} style={{position:'absolute', inset:0, minHeight:400}} />
          </div>
        </div>
      </div>
  );
};

export default ChartWrapper;
