import React, { useCallback } from 'react';
import { useTradingData } from '../context/HyperliquidTradingProvider';

/**
 * PairSelector (placeholder)
 * Props:
 *  - symbols: string[]
 *  - favorites?: string[]
 *  - onSelect(symbol)
 *  - onToggleFavorite?(symbol)
 *  - filterEnabled?: boolean
 */
const PairSelector = () => {
  const { tickers, selectedSymbol, setSelectedSymbol } = useTradingData();
  const onSelect = useCallback((sym) => setSelectedSymbol(sym), [setSelectedSymbol]);
  return (
    <div className="card h-100">
      <div className="card-header pb-2 pt-2 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Pairs</h5>
        <span className="badge bg-light text-dark">{tickers.length}</span>
      </div>
      <div className="card-body p-2" style={{maxHeight: 340, overflowY:'auto'}}>
        <ul className="list-unstyled mb-0 small">
          {tickers.map(t => {
            const active = t.symbol === selectedSymbol;
            return (
              <li
                key={t.symbol}
                className={`d-flex justify-content-between align-items-center px-2 py-1 rounded cursor-pointer ${active ? 'bg-primary text-white' : 'hover-bg-light'}`}
                style={{cursor:'pointer'}}
                onClick={() => onSelect(t.symbol)}
              >
                <span className="me-2">{t.symbol}</span>
                {(() => {
                  const pct = t.change24hPercent ?? 0;
                  const pctClass = pct > 0 ? 'text-success' : pct < 0 ? 'text-danger' : 'text-muted';
                  return (
                    <span className={pctClass}>
                      {pct > 0 ? '+' : ''}{pct.toFixed(2)}%
                    </span>
                  );
                })()}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PairSelector;
