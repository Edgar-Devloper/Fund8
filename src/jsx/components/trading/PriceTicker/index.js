import React from 'react';
import { useTradingData } from '../context/HyperliquidTradingProvider';

/**
 * PriceTicker (placeholder)
 * Props:
 *  - symbol: string
 *  - last: number
 *  - changePct24h?: number
 *  - high24h?: number
 *  - low24h?: number
 *  - volume24h?: number
 */
const PriceTicker = () => {
  const { selectedSymbol, tickers } = useTradingData();
  const t = tickers.find(x => x.symbol === selectedSymbol) || tickers[0];
  // Usar siempre el porcentaje correcto de 24h proveniente de Hyperliquid
  const pct = t ? (t.change24hPercent ?? 0) : 0;
  const pctClass = pct > 0 ? 'text-success' : pct < 0 ? 'text-danger' : 'text-muted';
  return (
    <div className="card">
      <div className="card-body py-2 d-flex justify-content-between align-items-center">
        <div>
          <span className="d-block fw-bold">{t?.symbol}</span>
          <small className="text-muted">Last 24h</small>
        </div>
        <div className="text-end">
          <div className="h5 mb-0">{t ? t.last.toLocaleString() : '--'}</div>
          <small className={pctClass}>{pct > 0 ? '+' : ''}{pct?.toFixed(2)}%</small>
        </div>
      </div>
    </div>
  );
};

export default PriceTicker;
