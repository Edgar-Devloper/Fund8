import React, { useState } from 'react';
import { useTradingData } from '../context/HyperliquidTradingProvider';
import { useTranslation } from 'react-i18next';
import './TradesTicker.css';

const TradesTicker = () => {
  const { trades, selectedSymbol } = useTradingData();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('trades'); // 'orderbook' | 'trades'
  
  const coinSymbol = selectedSymbol ? selectedSymbol.split('/')[0] : 'BTC';
  
  // Format time from timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--:--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="card trades-hl-container">
      {/* Header with Tabs */}
      <div className="trades-hl-header">
        <div className="trades-tabs">
          <button 
            className={`tab-btn ${activeTab === 'orderbook' ? 'active' : ''}`}
            onClick={() => setActiveTab('orderbook')}
          >
            Order Book
          </button>
          <button 
            className={`tab-btn ${activeTab === 'trades' ? 'active' : ''}`}
            onClick={() => setActiveTab('trades')}
          >
            Trades
          </button>
        </div>
        
        <button className="control-menu-btn">⋮</button>
      </div>
      
      {/* Trades Table */}
      {activeTab === 'trades' && (
        <div className="trades-hl-body">
          <div className="trades-table-header">
            <span>Price</span>
            <span>Size ({coinSymbol})</span>
            <span>Time</span>
          </div>
          
          <div className="trades-table-content">
            {trades && trades.length > 0 ? (
              trades.slice(0, 30).map((trade, i) => {
                // Generate unique key combining index, timestamp, price, and amount
                const uniqueKey = `trade-${coinSymbol}-${i}-${trade.ts || Date.now()}-${trade.price}-${trade.amount}`;
                
                return (
                  <div 
                    key={uniqueKey}
                    className={`trades-row ${trade.side === 'buy' ? 'buy-trade' : 'sell-trade'}`}
                  >
                    <span className={`price ${trade.side === 'buy' ? 'buy-price' : 'sell-price'}`}>
                      {typeof trade.price === 'number' ? trade.price.toFixed(1) : trade.price}
                    </span>
                    <span className="size">
                      {typeof trade.amount === 'number' ? trade.amount.toFixed(4) : trade.amount}
                    </span>
                    <span className="time">
                      {formatTime(trade.ts || trade.timestamp)}
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="external-link-icon">
                        <path d="M10 1H7v1h2.293L4.146 7.146l.708.708L10 2.707V5h1V1zM3 2H2v9h9V8h-1v2H3V2z"/>
                      </svg>
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted py-5">
                <small>No recent trades</small>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Order Book Tab (placeholder - links back to OrderBook component) */}
      {activeTab === 'orderbook' && (
        <div className="trades-hl-body">
          <div className="text-center text-muted py-5">
            <small>See Order Book component above</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradesTicker;
