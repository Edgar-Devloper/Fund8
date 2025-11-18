import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTradingData } from '../context/MockTradingDataProvider';
import { createChart, CrosshairMode } from 'lightweight-charts';
import TradingViewWidget from '../TradingViewWidget';

/**
 * ChartWrapper (placeholder)
 * Propósito: Encapsular librería de chart (apex/lightweight/tradingview) y exponer API uniforme.
 * Props planificadas:
 *  - symbol
 *  - interval (e.g. '1m','5m','1h')
 *  - data (candles)
 *  - studies (lista de indicadores activos)
 *  - onRangeChange?
 *  - onAddIndicator?
 */
// Generar datos de velas mock basados en un precio base
function generateCandles(base, count = 200, timeframeSec = 60) {
  const candles = [];
  let current = base;
  let ts = Math.floor(Date.now() / 1000) - count * timeframeSec;
  for (let i = 0; i < count; i++) {
    const open = current;
    const variance = current * (Math.random() - 0.5) * 0.01; // +-0.5%
    current = Math.max(0.01, current + variance);
    const close = current;
    const high = Math.max(open, close) * (1 + Math.random() * 0.002);
    const low = Math.min(open, close) * (1 - Math.random() * 0.002);
    candles.push({ time: ts, open, high, low, close });
    ts += timeframeSec; // salto según timeframe
  }
  return candles;
}

const ChartWrapper = () => {
  const { selectedSymbol, tickers } = useTradingData();
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  // Filtros personalizados
  const [timeframe, setTimeframe] = useState('1m'); // '1m' | '5m' | '15m' | '1h'
  const [length, setLength] = useState(240);       // número de velas
  const [showVolume, setShowVolume] = useState(true);
  // Modo avanzado TradingView embed
  const [advanced, setAdvanced] = useState(false);

  const timeframeToSec = useCallback((tf) => {
    switch(tf) {
      case '5m': return 300;
      case '15m': return 900;
      case '1h': return 3600;
      case '1m':
      default: return 60;
    }
  }, []);

  const rebuildData = useCallback((basePrice) => {
    if (!seriesRef.current) return;
    const sec = timeframeToSec(timeframe);
    const data = generateCandles(basePrice, length, sec);
    seriesRef.current.setData(data);
    if (showVolume) {
      const volData = data.map(c => ({ time: c.time, value: Math.max(1, Math.round(c.close * (Math.random()*0.3))) , color: c.close >= c.open ? '#16a34a99' : '#dc262699' }));
      volumeSeriesRef.current && volumeSeriesRef.current.setData(volData);
    } else if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData([]);
    }
    chartRef.current && chartRef.current.timeScale().fitContent();
  }, [length, timeframe, timeframeToSec, showVolume]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || advanced) return; // si estamos en modo TV no inicializamos lightweight chart

    // Crear chart una sola vez
    if (!chartRef.current) {
      chartRef.current = createChart(el, {
        layout: { background: { color: '#ffffff' }, textColor: '#222' },
        grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { visible: true },
        timeScale: { timeVisible: true, secondsVisible: false },
        localization: { locale: 'en-US' },
        // autoSize desactivado para evitar loop con ResizeObserver manual
      });
      seriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#16a34a', downColor: '#dc2626', borderVisible: false, wickUpColor: '#16a34a', wickDownColor: '#dc2626'
      });
      volumeSeriesRef.current = chartRef.current.addHistogramSeries({
        priceScaleId: '',
        priceFormat: { type: 'volume' },
        scaleMargins: { top: 0.8, bottom: 0 },
        color: '#888'
      });
    }

    const baseTicker = tickers.find(t => t.symbol === selectedSymbol) || tickers[0];
    if (baseTicker) {
      rebuildData(baseTicker.last);
    }
  }, [selectedSymbol, tickers, rebuildData, advanced]);

  // Resize observer optimizado para evitar 'ResizeObserver loop'
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chartRef.current || advanced) return;
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
  }, [advanced]);

  // Simulación de actualización incremental según timeframe (cada 5s)
  useEffect(() => {
    const id = setInterval(() => {
      if (!seriesRef.current || advanced) return;
      const baseTicker = tickers.find(t => t.symbol === selectedSymbol) || tickers[0];
      const sec = timeframeToSec(timeframe);
      const now = Math.floor(Date.now() / 1000);
      const bucketTime = now - (now % sec);
      const price = baseTicker.last * (1 + (Math.random() - 0.5) * 0.002);
      const candle = { time: bucketTime, open: price*0.995, high: price*1.003, low: price*0.992, close: price };
      seriesRef.current.update(candle);
      if (showVolume && volumeSeriesRef.current) {
        volumeSeriesRef.current.update({ time: bucketTime, value: Math.max(1, Math.round(price * (Math.random()*0.3))), color: candle.close >= candle.open ? '#16a34a99' : '#dc262699' });
      }
    }, 5000);
    return () => clearInterval(id);
  }, [selectedSymbol, tickers, timeframe, timeframeToSec, showVolume, advanced]);

  // Re-generar dataset cuando cambian filtros manuales
  useEffect(() => {
    const baseTicker = tickers.find(t => t.symbol === selectedSymbol) || tickers[0];
    if (!advanced && baseTicker) rebuildData(baseTicker.last);
  }, [timeframe, length, showVolume, rebuildData, selectedSymbol, tickers, advanced]);

  const handleLengthChange = (e) => setLength(parseInt(e.target.value,10));

  return (
    <div className="card h-100" style={{borderRadius:22}}>
      <div className="card-header d-flex flex-wrap gap-3 align-items-center" style={{borderTopLeftRadius:22, borderTopRightRadius:22, padding:'10px 18px'}}>
        <h6 className="mb-0 fw-semibold" style={{letterSpacing:'.4px'}}>Chart {advanced && <span className="badge bg-info ms-1">TV</span>}</h6>
        {!advanced && (
          <>
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
              <button onClick={() => chartRef.current && chartRef.current.timeScale().fitContent()} className="btn btn-sm btn-outline-secondary" style={{borderRadius:18}}>Auto-Fit</button>
            </div>
          </>
        )}
        <div className="ms-auto d-flex align-items-center gap-2">
          <button onClick={() => setAdvanced(a=>!a)} className="btn btn-sm btn-outline-primary" style={{borderRadius:18}}>
            {advanced ? 'Básico' : 'TV Avanzado'}
          </button>
          <span className="badge bg-primary" style={{borderRadius:20, padding:'6px 14px'}}>{advanced ? 'Data TV' : 'Mock'}</span>
        </div>
      </div>
      <div className="card-body" style={{height:'100%', padding:'14px 18px 18px', display:'flex', flexDirection:'column'}}>
        <div style={{flex:1, position:'relative', borderRadius:18, background:'#ffffff', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.4), 0 0 0 1px rgba(0,0,0,0.05)', overflow:'hidden'}}>
          {advanced ? (
            <TradingViewWidget symbol={selectedSymbol} theme={document.body.getAttribute('data-theme-version')==='dark'?'dark':'light'} />
          ) : (
            <div ref={containerRef} style={{position:'absolute', inset:0, minHeight:400}} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartWrapper;
