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
  const [timeframe, setTimeframe] = useState('1h'); // '1m' | '5m' | '15m' | '1h' | '1D' | '1W' | '1M'
  const [length, setLength] = useState(200);       // número de velas
  const [showVolume, setShowVolume] = useState(true);
  const [autoFitActive, setAutoFitActive] = useState(false);
  const [currentOHLC, setCurrentOHLC] = useState({ open: 0, high: 0, low: 0, close: 0, change: 0 });
  const [hoverVolume, setHoverVolume] = useState(null); // Volume on hover
  
  // Drawing tools state
  const [drawingMode, setDrawingMode] = useState(null); // null | 'line' | 'fibonacci' | 'trendline' | 'text' | 'network' | 'ruler' | 'zoom'
  const [drawings, setDrawings] = useState([]);
  const drawingsRef = useRef([]);
  const [activeTool, setActiveTool] = useState(null);
  
  // get coin id from symbol
  const coinId = selectedSymbol && selectedSymbol.includes('/') 
    ? selectedSymbol.split('/')[0].toLowerCase() 
    : (selectedSymbol || 'btc').toLowerCase();
  
  // fetch real candles from hyperliquid
  // For monthly timeframe, increase limit to ensure we get all available months
  const effectiveLength = timeframe === '1M' ? Math.max(length, 60) : length;
  const { candles: realCandles, loading: candlesLoading } = useCandles(coinId, timeframe, effectiveLength);

  // Store volume data by time for hover tooltip
  const volumeMapRef = useRef(new Map());

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
      
      // Log for debugging monthly timeframe
      if (timeframe === '1M' && validCandles.length > 0) {
        const lastCandle = validCandles[validCandles.length - 1];
        console.log('[ChartWrapper] Last valid candle for 1M:', {
          time: lastCandle.time,
          date: new Date(lastCandle.time * 1000).toISOString(),
          open: lastCandle.open,
          high: lastCandle.high,
          low: lastCandle.low,
          close: lastCandle.close,
          totalCandles: validCandles.length
        });
      }
      
      // use real candles from hyperliquid
      seriesRef.current.setData(validCandles);
      
      // Clear volume map and rebuild
      volumeMapRef.current.clear();
      
      if (showVolume && volumeSeriesRef.current) {
        // calculate volume from price movement (since hyperliquid candles don't include volume in this format)
        const volData = validCandles.map(c => {
          // Calculate approximate volume (you can replace this with real volume from API if available)
          const volume = Math.abs(c.close - c.open) * (c.high - c.low) * 1000; // approximate volume
          const volumeValue = Math.max(1, Math.round(volume));
          
          // Store volume in map for hover tooltip
          volumeMapRef.current.set(c.time, volumeValue);
          
          return {
            time: c.time,
            value: volumeValue,
            color: c.close >= c.open ? '#00c08799' : '#ef444499'
          };
        });
        volumeSeriesRef.current.setData(volData);
      } else if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData([]);
      }
      
      if (chartRef.current) {
        // Only fit content if not daily/weekly/monthly timeframe to prevent month/year grouping
        // Note: '1m' is minute (should fit), '1M' is month (should not fit)
        if (timeframe !== '1D' && timeframe !== '1d' && timeframe !== '1W' && timeframe !== '1w' && timeframe !== '1M') {
          chartRef.current.timeScale().fitContent();
        } else if (timeframe === '1M' && validCandles.length > 0) {
          // For monthly, ensure we show the last month by setting visible range
          const lastCandleTime = validCandles[validCandles.length - 1].time;
          const firstCandleTime = validCandles[0].time;
          // Calculate end time: last candle time + 1 month (to show the full last month)
          const endTime = lastCandleTime + (31 * 24 * 60 * 60); // Add 31 days to show full last month
          
          console.log('[ChartWrapper] Attempting to set visible range for 1M:', {
            from: new Date(firstCandleTime * 1000).toISOString(),
            to: new Date(endTime * 1000).toISOString(),
            lastCandleTime: new Date(lastCandleTime * 1000).toISOString(),
            totalCandles: validCandles.length
          });
          
          // Use setTimeout to ensure chart is ready
          setTimeout(() => {
            if (chartRef.current) {
              try {
                // Try setVisibleRange first
                chartRef.current.timeScale().setVisibleRange({
                  from: firstCandleTime,
                  to: endTime
                });
                console.log('[ChartWrapper] Successfully set visible range');
              } catch (e) {
                console.warn('[ChartWrapper] Error setting visible range, trying scrollToRealTime:', e);
                // Fallback: try scrollToRealTime
                try {
                  if (typeof chartRef.current.timeScale().scrollToRealTime === 'function') {
                    chartRef.current.timeScale().scrollToRealTime();
                    console.log('[ChartWrapper] Used scrollToRealTime');
                  } else {
                    // Last resort: scroll to last position
                    chartRef.current.timeScale().scrollToPosition(lastCandleTime, true);
                    console.log('[ChartWrapper] Used scrollToPosition');
                  }
                } catch (e2) {
                  console.warn('[ChartWrapper] Error with fallback scroll methods:', e2);
                }
              }
            }
          }, 100);
        }
        // Force time scale to be visible and update
        chartRef.current.timeScale().applyOptions({
          timeVisible: true,
          visible: true,
          secondsVisible: false,
          fixLeftEdge: false,
          fixRightEdge: false,
          allowBoldLabels: true,
          rightOffset: 20 // Add right offset to ensure last candle is visible
        });
      }
    } catch (error) {
      console.error('[ChartWrapper] Error setting chart data:', error);
      // Don't throw, just log the error
    }
  }, [realCandles, showVolume, timeframe]);

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
        borderColor: '#1e2541',
        visible: true,
        rightOffset: 12,
        barSpacing: 3,
        rightBarStaysOnScroll: true,
        lockVisibleTimeRangeOnResize: true,
        fixLeftEdge: false,
        fixRightEdge: false,
        allowBoldLabels: true,
        minBarSpacing: 0.5
      },
          localization: {
            locale: 'es-ES',
            dateFormat: 'dd MMM yyyy',
            timeFormat: 'HH:mm',
            priceFormatter: (price) => {
              return price.toFixed(2);
            }
          },
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
          
          // Subscribe to crosshair move to show volume on hover
          chartInstance.subscribeCrosshairMove(param => {
            if (isMounted && param.time) {
              // Get volume for this candle time
              const volume = volumeMapRef.current.get(param.time);
              if (volume !== undefined) {
                setHoverVolume(volume);
              } else {
                setHoverVolume(null);
              }
            } else if (isMounted) {
              // Mouse left the chart area
              setHoverVolume(null);
            }
          });
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
      
      // Unsubscribe from crosshair move
      if (chart) {
        try {
          chart.unsubscribeCrosshairMove();
        } catch (e) {
          // Ignore errors
        }
      }
      
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

  // Update date format based on timeframe
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Determine date format based on timeframe
    let dateFormat = 'dd MMM yyyy';
    let timeFormat = 'HH:mm';
    let secondsVisible = false;
    let barSpacing = 3;
    let minBarSpacing = 0.5;
    
    if (timeframe === '1D' || timeframe === '1d') {
      // For daily: show day/month format
      dateFormat = 'dd/MM';
      timeFormat = '';
      barSpacing = 5;
      minBarSpacing = 1;
    } else if (timeframe === '1W' || timeframe === '1w') {
      // For weekly: show day/month format
      dateFormat = 'dd/MM';
      timeFormat = '';
      barSpacing = 8;
      minBarSpacing = 2;
    } else if (timeframe === '1M') {
      // For monthly: show month/year format
      // lightweight-charts format: use 'MMM yyyy' for month/year display
      dateFormat = 'MMM yyyy';
      timeFormat = '';
      barSpacing = 20;
      minBarSpacing = 8;
    } else if (timeframe === '1h') {
      // For hourly: show date and time
      dateFormat = 'dd MMM';
      timeFormat = 'HH:mm';
      barSpacing = 3;
      minBarSpacing = 0.5;
    } else {
      // For minutes: show date and time
      dateFormat = 'dd MMM';
      timeFormat = 'HH:mm';
      barSpacing = 3;
      minBarSpacing = 0.5;
      if (timeframe === '1m') {
        secondsVisible = false;
      }
    }
    
    // Update chart localization and timeScale
    const timeScaleOptions = {
      secondsVisible: secondsVisible,
      barSpacing: barSpacing,
      minBarSpacing: minBarSpacing
    };
    
    // For monthly timeframe, add custom tick mark formatter
    if (timeframe === '1M') {
      timeScaleOptions.tickMarkFormatter = (time, tickMarkType, locale) => {
        const date = new Date(time * 1000);
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${month} ${year}`;
      };
    }
    
    chartRef.current.applyOptions({
      localization: {
        locale: 'es-ES',
        dateFormat: dateFormat,
        timeFormat: timeFormat,
        priceFormatter: (price) => {
          return price.toFixed(2);
        }
      },
      timeScale: timeScaleOptions
    });
    
  }, [timeframe, realCandles]);

  // Separate effect to ensure last month is visible for monthly timeframe
  useEffect(() => {
    if (timeframe === '1M' && chartRef.current && realCandles && realCandles.length > 0) {
      // Wait a bit for chart to render
      const timer = setTimeout(() => {
        if (chartRef.current && realCandles.length > 0) {
          const lastCandleTime = realCandles[realCandles.length - 1].time;
          try {
            // Try to scroll to the last candle position
            const timeScale = chartRef.current.timeScale();
            // Get current visible range
            const visibleRange = timeScale.getVisibleRange();
            if (visibleRange) {
              // If last candle is not in visible range, scroll to it
              if (visibleRange.to < lastCandleTime) {
                const endTime = lastCandleTime + (31 * 24 * 60 * 60); // Add 31 days buffer
                timeScale.setVisibleRange({
                  from: visibleRange.from,
                  to: endTime
                });
                console.log('[ChartWrapper] Scrolled to show last month:', {
                  lastCandleTime: new Date(lastCandleTime * 1000).toISOString(),
                  endTime: new Date(endTime * 1000).toISOString()
                });
              }
            } else {
              // If no visible range, set it to show last month
              const firstCandleTime = realCandles[0].time;
              const endTime = lastCandleTime + (31 * 24 * 60 * 60);
              timeScale.setVisibleRange({
                from: firstCandleTime,
                to: endTime
              });
              console.log('[ChartWrapper] Set initial visible range for last month');
            }
          } catch (e) {
            console.warn('[ChartWrapper] Error in monthly scroll effect:', e);
          }
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [timeframe, realCandles]);


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
  
  const formatVolume = (volume) => {
    if (!volume || volume === 0) return '0';
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
    return volume.toFixed(0);
  };

  return (
      <div className="card h-100 chart-wrapper-container" style={{borderRadius:0, background: 'var(--hl-dark-card, #151a2e)', border: '1px solid var(--hl-dark-border, #1e2541)', height: '100%', display: 'flex', flexDirection: 'column'}}>
        <div className="card-header d-flex flex-wrap gap-2 align-items-center chart-header" style={{borderTopLeftRadius:0, borderTopRightRadius:0, background: 'var(--hl-dark-card, #151a2e)', borderBottom: '1px solid var(--hl-dark-border, #1e2541)', flexShrink: 0}}>
          
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
              {/* Volume display - shows hover volume when mouse is over a candle */}
              <div className="chart-ohlc-item">
                <span className="chart-ohlc-label">Vol</span>
                <span className="chart-ohlc-value" style={{ color: hoverVolume !== null ? 'var(--hl-accent-teal, #00c087)' : 'inherit' }}>
                  {hoverVolume !== null 
                    ? formatVolume(hoverVolume)
                    : (volumeMapRef.current.size > 0 
                        ? formatVolume(Array.from(volumeMapRef.current.values()).pop())
                        : '--')
                  }
                </span>
              </div>
              <span className={`chart-ohlc-change ${currentOHLC.change >= 0 ? 'positive' : 'negative'}`}>
                {currentOHLC.change >= 0 ? '+' : ''}{formatPrice(currentOHLC.change)} ({currentOHLC.changePercent >= 0 ? '+' : ''}{currentOHLC.changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
          
          <div className="d-flex align-items-center gap-1 small flex-wrap" style={{flexShrink: 0}}>
            {['1m','5m','15m','1h','1D','1W','1M'].map(tf => (
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
            {/* Chart Drawing Tools Bar */}
            <div className="chart-tools-bar">
              <div className="chart-tools-group">
                <button
                  className={`chart-tool-btn ${activeTool === 'select' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool(activeTool === 'select' ? null : 'select');
                    setDrawingMode(null);
                  }}
                  title="Select Tool"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8 1V3M8 13V15M1 8H3M13 8H15" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  className={`chart-tool-btn ${activeTool === 'trendline' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool(activeTool === 'trendline' ? null : 'trendline');
                    setDrawingMode('trendline');
                  }}
                  title="Trend Line"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="3" cy="13" r="2" fill="currentColor"/>
                    <circle cx="13" cy="3" r="2" fill="currentColor"/>
                    <path d="M5 11L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M3 13L5 11M11 5L13 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  className={`chart-tool-btn ${activeTool === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTool(activeTool === 'settings' ? null : 'settings')}
                  title="Settings"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4H6M10 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M2 8H6M10 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M2 12H6M10 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="8" cy="4" r="1.5" fill="currentColor"/>
                    <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
                  </svg>
                </button>
                <button
                  className={`chart-tool-btn ${activeTool === 'brush' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool(activeTool === 'brush' ? null : 'brush');
                    setDrawingMode('brush');
                  }}
                  title="Brush Tool"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 13L8 8L10 10L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 10L12 8L13 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  className={`chart-tool-btn ${activeTool === 'text' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool(activeTool === 'text' ? null : 'text');
                    setDrawingMode('text');
                  }}
                  title="Text Tool"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 3V13M8 3V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  className={`chart-tool-btn ${activeTool === 'network' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool(activeTool === 'network' ? null : 'network');
                    setDrawingMode('network');
                  }}
                  title="Network/Graph"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                    <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
                    <circle cx="13" cy="3" r="1.5" fill="currentColor"/>
                    <circle cx="3" cy="13" r="1.5" fill="currentColor"/>
                    <circle cx="13" cy="13" r="1.5" fill="currentColor"/>
                    <path d="M8 8L3 3M8 8L13 3M8 8L3 13M8 8L13 13M3 3L13 3M3 13L13 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  className={`chart-tool-btn ${activeTool === 'advanced' ? 'active' : ''}`}
                  onClick={() => setActiveTool(activeTool === 'advanced' ? null : 'advanced')}
                  title="Advanced Settings"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4H6M10 4H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M2 8H6M10 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M2 12H6M10 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="8" cy="4" r="1.5" fill="currentColor"/>
                    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                    <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
                    <circle cx="8" cy="8" r="0.5" fill="currentColor"/>
                  </svg>
                </button>
                <button
                  className={`chart-tool-btn ${activeTool === 'emoji' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool(activeTool === 'emoji' ? null : 'emoji');
                    setDrawingMode('emoji');
                  }}
                  title="Add Comment/Emoji"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="6" cy="6" r="1" fill="currentColor"/>
                    <circle cx="10" cy="6" r="1" fill="currentColor"/>
                    <path d="M6 10C6 10 7 11 8 11C9 11 10 10 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="chart-tools-separator"></div>
              <div className="chart-tools-group">
                <button
                  className={`chart-tool-btn ${activeTool === 'ruler' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool(activeTool === 'ruler' ? null : 'ruler');
                    setDrawingMode('ruler');
                  }}
                  title="Ruler Tool"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 12L12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M3 10L5 12M7 8L9 10M11 6L13 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  className={`chart-tool-btn ${activeTool === 'zoom' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool(activeTool === 'zoom' ? null : 'zoom');
                    if (chartRef.current) {
                      chartRef.current.timeScale().fitContent();
                    }
                  }}
                  title="Zoom In"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M7 5V9M5 7H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
            <div ref={containerRef} className="chart-canvas-inner" />
          </div>
        </div>
      </div>
  );
};

export default ChartWrapper;
