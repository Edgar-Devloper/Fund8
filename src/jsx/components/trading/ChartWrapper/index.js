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
  const [currentOHLC, setCurrentOHLC] = useState({ open: 0, high: 0, low: 0, close: 0, change: 0 });
  
  // Drawing tools state
  const [drawingMode, setDrawingMode] = useState(null); // null | 'line' | 'fibonacci'
  const [drawings, setDrawings] = useState([]);
  const drawingsRef = useRef([]);
  
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
            color: c.close >= c.open ? '#00c08799' : '#ef444499'
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
          layout: { 
            background: { color: '#0a0e27' }, // Fondo oscuro Hyperliquid
            textColor: '#a0aec0' 
          },
          grid: { 
            vertLines: { color: '#1e2541' }, 
            horzLines: { color: '#1e2541' } 
          },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { 
            visible: true,
            borderColor: '#1e2541'
          },
          timeScale: { 
            timeVisible: true, 
            secondsVisible: false,
            borderColor: '#1e2541'
          },
          localization: { locale: 'en-US' },
          // autoSize desactivado para evitar loop con ResizeObserver manual
        });
        
        if (isMounted) {
          seriesInstance = chartInstance.addCandlestickSeries({
            upColor: '#00c087', // Verde teal Hyperliquid
            downColor: '#ef4444', // Rojo más vibrante
            borderVisible: false, 
            wickUpColor: '#00c087', 
            wickDownColor: '#ef4444'
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
    
    // Update current OHLC display with latest candle
    const lastCandle = realCandles[realCandles.length - 1];
    if (lastCandle) {
      const change = lastCandle.close - lastCandle.open;
      const changePercent = (change / lastCandle.open) * 100;
      setCurrentOHLC({
        open: lastCandle.open,
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close,
        change: change,
        changePercent: changePercent
      });
    }
  }, [selectedSymbol, realCandles, rebuildData]);

  // Resize observer optimizado para evitar 'ResizeObserver loop'
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chartRef.current) return;
    let frame = null;
    let last = { w: 0, h: 0 };
    const resize = (width, height) => {
      if (!chartRef.current) return;
      // Ensure minimum dimensions for mobile
      const minWidth = 280;
      const minHeight = 200;
      const finalWidth = Math.max(minWidth, Math.floor(width));
      const finalHeight = Math.max(minHeight, Math.floor(height));
      
      if (finalWidth === last.w && finalHeight === last.h) return; // evitar reentradas innecesarias
      last = { w: finalWidth, h: finalHeight };
      chartRef.current.applyOptions({ width: finalWidth, height: finalHeight });
    };
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => resize(width, height));
    });
    observer.observe(el);
    // inicial - force resize after a small delay to ensure parent has rendered
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      resize(rect.width, rect.height);
    }, 100);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  // update chart when new candles arrive (refresh every 10 seconds for real-time updates)
  useEffect(() => {
    if (!realCandles || realCandles.length === 0) return;
    
    const id = setInterval(() => {
      if (!seriesRef.current) return;
      // rebuild data to get latest candles and update OHLC
      rebuildData();
      
      // Update OHLC display
      const lastCandle = realCandles[realCandles.length - 1];
      if (lastCandle) {
        const change = lastCandle.close - lastCandle.open;
        const changePercent = (change / lastCandle.open) * 100;
        setCurrentOHLC({
          open: lastCandle.open,
          high: lastCandle.high,
          low: lastCandle.low,
          close: lastCandle.close,
          change: change,
          changePercent: changePercent
        });
      }
    }, 10000); // refresh every 10 seconds for more dynamic feel
    
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

  // Drawing tools functions
  const addHorizontalLine = useCallback((price, color = '#00c087', label = '') => {
    if (!seriesRef.current) return;
    
    const lineId = `line-${Date.now()}`;
    const priceLine = {
      id: lineId,
      price: price,
      color: color,
      lineWidth: 2,
      lineStyle: 0, // solid
      axisLabelVisible: true,
      title: label || `${price.toFixed(2)}`,
    };
    
    const lineObj = seriesRef.current.createPriceLine(priceLine);
    
    const newDrawing = {
      id: lineId,
      type: 'line',
      price: price,
      color: color,
      label: label,
      lineObj: lineObj
    };
    
    drawingsRef.current.push(newDrawing);
    setDrawings([...drawingsRef.current]);
    
    return lineId;
  }, []);

  const addFibonacci = useCallback((highPrice, lowPrice) => {
    if (!seriesRef.current) return;
    
    const fibLevels = [
      { level: 0, color: '#ef4444', label: '0% (High)' },
      { level: 0.236, color: '#f97316', label: '23.6%' },
      { level: 0.382, color: '#eab308', label: '38.2%' },
      { level: 0.5, color: '#00c087', label: '50%' },
      { level: 0.618, color: '#06b6d4', label: '61.8%' },
      { level: 1, color: '#8b5cf6', label: '100% (Low)' }
    ];
    
    const fibId = `fib-${Date.now()}`;
    const fibLines = [];
    
    fibLevels.forEach(({ level, color, label }) => {
      const price = highPrice - (highPrice - lowPrice) * level;
      const priceLine = {
        price: price,
        color: color,
        lineWidth: 1,
        lineStyle: 2, // dashed
        axisLabelVisible: true,
        title: label,
      };
      
      const lineObj = seriesRef.current.createPriceLine(priceLine);
      fibLines.push({ level, price, lineObj, color, label });
    });
    
    const newDrawing = {
      id: fibId,
      type: 'fibonacci',
      highPrice: highPrice,
      lowPrice: lowPrice,
      lines: fibLines
    };
    
    drawingsRef.current.push(newDrawing);
    setDrawings([...drawingsRef.current]);
    
    return fibId;
  }, []);

  const clearAllDrawings = useCallback(() => {
    if (!seriesRef.current) return;
    
    drawingsRef.current.forEach(drawing => {
      if (drawing.type === 'line' && drawing.lineObj) {
        seriesRef.current.removePriceLine(drawing.lineObj);
      } else if (drawing.type === 'fibonacci' && drawing.lines) {
        drawing.lines.forEach(line => {
          if (line.lineObj) {
            seriesRef.current.removePriceLine(line.lineObj);
          }
        });
      }
    });
    
    drawingsRef.current = [];
    setDrawings([]);
  }, []);

  const handleChartClick = useCallback((param) => {
    if (!param.point || !drawingMode) return;
    
    const price = seriesRef.current.coordinateToPrice(param.point.y);
    
    if (drawingMode === 'line') {
      addHorizontalLine(price, '#00c087', 'Support/Resistance');
      setDrawingMode(null); // Deactivate after drawing
    } else if (drawingMode === 'fibonacci') {
      // For fibonacci, we need two clicks - high and low
      // This is simplified: using current price as one point and a fixed range
      const range = price * 0.1; // 10% range
      addFibonacci(price + range, price - range);
      setDrawingMode(null);
    }
  }, [drawingMode, addHorizontalLine, addFibonacci]);

  // Subscribe to chart clicks
  useEffect(() => {
    if (!chartRef.current) return;
    
    const chart = chartRef.current;
    chart.subscribeClick(handleChartClick);
    
    return () => {
      chart.unsubscribeClick(handleChartClick);
    };
  }, [handleChartClick]);

  const formatPrice = (price) => price ? price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0.0';

  return (
      <div className="card h-100 chart-wrapper-container" style={{borderRadius:22, background: 'var(--hl-dark-card, #151a2e)', border: '1px solid var(--hl-dark-border, #1e2541)'}}>
        <div className="card-header d-flex flex-wrap gap-2 align-items-center chart-header" style={{borderTopLeftRadius:22, borderTopRightRadius:22, background: 'var(--hl-dark-card, #151a2e)', borderBottom: '1px solid var(--hl-dark-border, #1e2541)'}}>
          <h6 className="mb-0 fw-semibold" style={{letterSpacing:'.4px', color: 'var(--hl-text-primary, #ffffff)', flexShrink: 0}}>Chart</h6>
          
          {/* OHLC Display */}
          {currentOHLC.close > 0 && (
            <div className="chart-ohlc-display">
              <div className="chart-ohlc-item">
                <span className="chart-ohlc-label">O</span>
                <span className={`chart-ohlc-value ${currentOHLC.change >= 0 ? 'positive' : 'negative'}`}>
                  {formatPrice(currentOHLC.open)}
                </span>
              </div>
              <div className="chart-ohlc-item">
                <span className="chart-ohlc-label">H</span>
                <span className={`chart-ohlc-value ${currentOHLC.change >= 0 ? 'positive' : 'negative'}`}>
                  {formatPrice(currentOHLC.high)}
                </span>
              </div>
              <div className="chart-ohlc-item">
                <span className="chart-ohlc-label">L</span>
                <span className={`chart-ohlc-value ${currentOHLC.change >= 0 ? 'positive' : 'negative'}`}>
                  {formatPrice(currentOHLC.low)}
                </span>
              </div>
              <div className="chart-ohlc-item">
                <span className="chart-ohlc-label">C</span>
                <span className={`chart-ohlc-value ${currentOHLC.change >= 0 ? 'positive' : 'negative'}`}>
                  {formatPrice(currentOHLC.close)}
                </span>
              </div>
              <span className={`chart-ohlc-change ${currentOHLC.change >= 0 ? 'positive' : 'negative'}`}>
                {currentOHLC.change >= 0 ? '+' : ''}{formatPrice(currentOHLC.change)} ({currentOHLC.changePercent >= 0 ? '+' : ''}{currentOHLC.changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
          
          <div className="d-flex align-items-center gap-1 small flex-wrap" style={{flexShrink: 0}}>
            {['1m','5m','15m','1h'].map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)} className={`btn btn-sm ${tf===timeframe?'btn-primary':'btn-outline-secondary'}`} style={{padding:'2px 8px', borderRadius:14, fontSize: '11px'}}>{tf}</button>
            ))}
          </div>
          <div className="d-flex align-items-center gap-1 small flex-wrap" style={{flexShrink: 0}}>
            <select value={length} onChange={handleLengthChange} className="form-select form-select-sm" style={{width:85, borderRadius:12, fontSize: '11px', padding: '2px 6px'}}>
              {[120,240,360,480,720].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button onClick={() => setShowVolume(v=>!v)} className={`btn btn-sm ${showVolume?'btn-secondary':'btn-outline-secondary'}`} style={{borderRadius:14, padding:'2px 8px', fontSize: '11px'}}>
              Vol
            </button>
            <button 
              onClick={handleAutoFit} 
              className={`btn btn-sm ${autoFitActive ? 'btn-success' : 'btn-outline-secondary'}`} 
              style={{borderRadius:14, transition: 'all 0.3s ease', padding:'2px 8px', fontSize: '11px'}}
              title="Ajusta el gráfico para ver todas las velas"
            >
              {autoFitActive ? '✓' : '⇄'}
            </button>
          </div>
          
          {/* Drawing Tools */}
          <div className="d-flex align-items-center gap-1 small flex-wrap" style={{flexShrink: 0, borderLeft: '1px solid var(--hl-dark-border, #1e2541)', paddingLeft: '8px'}}>
            <button 
              onClick={() => setDrawingMode(drawingMode === 'line' ? null : 'line')} 
              className={`btn btn-sm ${drawingMode === 'line' ? 'btn-info' : 'btn-outline-secondary'}`} 
              style={{borderRadius:14, padding:'2px 8px', fontSize: '11px'}}
              title="Dibujar línea horizontal"
            >
              ──
            </button>
            <button 
              onClick={() => setDrawingMode(drawingMode === 'fibonacci' ? null : 'fibonacci')} 
              className={`btn btn-sm ${drawingMode === 'fibonacci' ? 'btn-warning' : 'btn-outline-secondary'}`} 
              style={{borderRadius:14, padding:'2px 8px', fontSize: '11px'}}
              title="Fibonacci Retracement"
            >
              φ
            </button>
            {drawings.length > 0 && (
              <button 
                onClick={clearAllDrawings} 
                className="btn btn-sm btn-outline-danger" 
                style={{borderRadius:14, padding:'2px 8px', fontSize: '11px'}}
                title="Limpiar todos los dibujos"
              >
                🗑️
              </button>
            )}
          </div>
          
          <div className="ms-auto d-flex align-items-center gap-2" style={{flexShrink: 0}}>
            {/* Real-time indicator */}
            {!candlesLoading && realCandles.length > 0 && (
              <div className="chart-live-indicator">
                <span className="live-dot"></span>
                <span className="live-text">LIVE</span>
              </div>
            )}
          </div>
        </div>
        <div className="card-body" style={{height:'100%', display:'flex', flexDirection:'column'}}>
          {/* Drawing mode indicator */}
          {drawingMode && (
            <div 
              style={{
                padding: '6px 12px',
                background: 'rgba(0, 192, 135, 0.1)',
                border: '1px solid rgba(0, 192, 135, 0.3)',
                borderRadius: '8px',
                marginBottom: '8px',
                fontSize: '12px',
                color: 'var(--hl-accent-teal, #00c087)',
                textAlign: 'center',
                fontWeight: 600
              }}
            >
              {drawingMode === 'line' ? '📍 Haz click en el gráfico para trazar una línea' : '📐 Haz click para colocar Fibonacci'}
            </div>
          )}
          <div className="chart-canvas-container" style={{cursor: drawingMode ? 'crosshair' : 'default'}}>
            <div ref={containerRef} className="chart-canvas-inner" />
          </div>
        </div>
      </div>
  );
};

export default ChartWrapper;
