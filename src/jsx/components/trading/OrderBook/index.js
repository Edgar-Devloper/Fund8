import React, { useMemo } from 'react';
import { useTradingData } from '../context/MockTradingDataProvider';

/**
 * OrderBook (placeholder)
 * Props planificadas:
 *  - bids: Array<{ price:number, size:number }>
 *  - asks: Array<{ price:number, size:number }>
 *  - midPrice?: number
 *  - onSelectPrice?(price:number)
 *  - depthAggregation (config para agrupar)
 *  - maxRows?: number
 *  - spread?: number (calculado si no pasa)
 */
const OrderBook = () => {
  const { orderBook } = useTradingData();
  const { bids = [], asks = [] } = orderBook || {};
  const maxAmount = useMemo(() => Math.max(
    ...bids.map(b => b.amount),
    ...asks.map(a => a.amount),
    1
  ), [bids, asks]);
  const spread = useMemo(() => {
    if (!bids.length || !asks.length) return '--';
    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;
    return (bestAsk - bestBid).toFixed(2);
  }, [bids, asks]);
  return (
    <div className="card h-100" style={{borderRadius:22}}>
      <div className="card-header d-flex align-items-center gap-2" style={{padding:'10px 16px', borderTopLeftRadius:22, borderTopRightRadius:22}}>
        <h6 className="mb-0 fw-semibold" style={{letterSpacing:'.4px'}}>Order Book</h6>
        <span className="badge bg-secondary ms-auto" style={{borderRadius:18}}>spread {spread}</span>
      </div>
      <div className="card-body" style={{padding:'10px 14px 14px'}}>
        <div className="row g-3 small" style={{height:'100%'}}>
          <div className="col-6 d-flex flex-column" style={{maxHeight:300}}>
            <div className="flex-grow-1 position-relative rounded-3" style={{background:'#fafafa', border:'1px solid #ececec', overflow:'hidden'}}>
              <table className="table table-sm table-borderless mb-0 align-middle" style={{fontSize:12}}>
                <thead className="text-muted" style={{position:'sticky', top:0, background:'#fafafa'}}>
                  <tr><th>Bid Px</th><th className="text-end">Amt</th></tr>
                </thead>
                <tbody style={{overflowY:'auto'}}>
                  {bids.slice(0,18).map((b,i) => (
                    <tr key={i} className="position-relative" style={{height:18}}>
                      <td style={{position:'relative', zIndex:2}}>{b.price.toFixed(2)}</td>
                      <td className="text-end" style={{position:'relative', zIndex:2}}>{b.amount}</td>
                      <td className="position-absolute top-0 start-0 h-100" style={{width:`${(b.amount/maxAmount)*100}%`, background:'rgba(25,135,84,0.18)', zIndex:1, borderTopRightRadius:4, borderBottomRightRadius:4}}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="col-6 d-flex flex-column" style={{maxHeight:300}}>
            <div className="flex-grow-1 position-relative rounded-3" style={{background:'#fafafa', border:'1px solid #ececec', overflow:'hidden'}}>
              <table className="table table-sm table-borderless mb-0 align-middle" style={{fontSize:12}}>
                <thead className="text-muted" style={{position:'sticky', top:0, background:'#fafafa'}}>
                  <tr><th>Ask Px</th><th className="text-end">Amt</th></tr>
                </thead>
                <tbody>
                  {asks.slice(0,18).map((a,i) => (
                    <tr key={i} className="position-relative" style={{height:18}}>
                      <td style={{position:'relative', zIndex:2}}>{a.price.toFixed(2)}</td>
                      <td className="text-end" style={{position:'relative', zIndex:2}}>{a.amount}</td>
                      <td className="position-absolute top-0 start-0 h-100" style={{width:`${(a.amount/maxAmount)*100}%`, background:'rgba(220,53,69,0.18)', zIndex:1, borderTopRightRadius:4, borderBottomRightRadius:4}}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
