import React from 'react';
import { useTradingData } from '../context/MockTradingDataProvider';

/**
 * TradesTicker (placeholder)
 * Props:
 *  - trades: Array<{ id:string, price:number, qty:number, side:'buy'|'sell', ts:number }>
 *  - maxItems?: number
 *  - highlightDurationMs?: number (para animar nuevos)
 */
const TradesTicker = () => {
  const { trades } = useTradingData();
  return (
    <div className="card h-100" style={{borderRadius:22}}>
      <div className="card-header d-flex align-items-center" style={{padding:'10px 16px', borderTopLeftRadius:22, borderTopRightRadius:22}}>
        <h6 className="mb-0 fw-semibold" style={{letterSpacing:'.4px'}}>Trades</h6>
        <span className="badge bg-secondary ms-auto" style={{borderRadius:18}}>{trades.length}</span>
      </div>
      <div className="card-body" style={{padding:'10px 14px 14px', maxHeight:300, overflow:'hidden'}}>
        <div className="position-relative rounded-3" style={{background:'#fafafa', border:'1px solid #ececec', height:'100%', overflow:'auto'}}>
          <table className="table table-sm table-borderless mb-0 small align-middle" style={{fontSize:12}}>
            <thead className="text-muted" style={{position:'sticky', top:0, background:'#fafafa'}}>
              <tr>
                <th style={{width:50}}>Side</th>
                <th className="text-end">Price</th>
                <th className="text-end">Amt</th>
                <th className="text-end">Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(0,60).map(tr => (
                <tr key={tr.id}>
                  <td className={tr.side === 'buy' ? 'text-success' : 'text-danger'} style={{textTransform:'capitalize'}}>{tr.side}</td>
                  <td className="text-end">{tr.price.toFixed(2)}</td>
                  <td className="text-end">{tr.amount}</td>
                  <td className="text-end">{new Date(tr.ts).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradesTicker;
