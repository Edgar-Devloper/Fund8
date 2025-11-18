import React, { useEffect, useRef, useState } from 'react';
import { mapToTradingViewSymbol } from './symbolMapping';

/**
 * TradingViewWidget
 * Carga dinámica del script tv.js y embebe el widget avanzado.
 * No controla todavía indicadores personalizados; se enfoca en proveer una vista rápida avanzada.
 */
export default function TradingViewWidget({ symbol, interval = '60', theme = 'dark' }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const tvSymbol = mapToTradingViewSymbol(symbol);

  useEffect(() => {
    let cancelled = false;
    function loadScript() {
      return new Promise((resolve, reject) => {
        if (window.TradingView) return resolve();
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
      });
    }
    loadScript().then(() => {
      if (cancelled) return;
      setReady(true);
    }).catch(err => {
      console.error('[TradingViewWidget] error cargando script', err);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !window.TradingView || !containerRef.current) return;
    // Limpiar contenido previo
    containerRef.current.innerHTML = '';
    // Instanciar widget
  // Uso indirecto del global TradingView (expuesto por script tv.js)
    try {
      new window.TradingView.widget({
        symbol: tvSymbol,
        interval, // '1','5','15','60','240','D'
        container_id: containerRef.current.id,
        width: '100%',
        height: '100%',
        timezone: 'Etc/UTC',
        theme: theme === 'dark' ? 'dark' : 'light',
        style: '1',
        locale: 'en',
        toolbar_bg: theme === 'dark' ? '#0f172a' : '#f5f5f5',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        withdateranges: true,
        allow_symbol_change: false,
      });
    } catch (e) {
      console.error('[TradingViewWidget] fallo al crear widget', e);
    }
  }, [ready, tvSymbol, interval, theme]);

  return (
    <div style={{position:'absolute', inset:0}}>
      <div id={`tv_container_${symbol.replace(/[^a-zA-Z0-9]/g,'_')}`} ref={containerRef} style={{width:'100%', height:'100%'}} />
      {!ready && (
        <div className="d-flex align-items-center justify-content-center h-100 w-100 text-muted small" style={{backdropFilter:'blur(2px)'}}>
          Cargando TradingView...
        </div>
      )}
    </div>
  );
}
