import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useTradingData } from '../context/HyperliquidTradingProvider';
import { useTranslation } from 'react-i18next';
import './OrderBook.css';

// Import crypto icons
import btcIcon from '../../../../images/icons/btc.png';
import ethIcon from '../../../../images/icons/eth.png';
import solIcon from '../../../../images/icons/sol.png';
import ltcIcon from '../../../../images/icons/ltc.png';
import moneroIcon from '../../../../images/icons/monero.png';
import adaIcon from '../../../../images/icons/ada.png';
import dogeIcon from '../../../../images/icons/doge.png';

// Icon mapping
const iconMap = {
  'BTC': btcIcon,
  'ETH': ethIcon,
  'SOL': solIcon,
  'LTC': ltcIcon,
  'XMR': moneroIcon,
  'ADA': adaIcon,
  'DOGE': dogeIcon,
};

const OrderBook = () => {
  const { orderBook, selectedSymbol, trades, tickers, setSelectedSymbol } = useTradingData();
  const { t } = useTranslation(); // eslint-disable-line
  const { bids = [], asks = [] } = orderBook || {};
  
  const [activeTab, setActiveTab] = useState('orderbook'); // 'orderbook' | 'trades'
  const [grouping, setGrouping] = useState('0.1');
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSymbolDropdown(false);
      }
    };
    
    if (showSymbolDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSymbolDropdown]);
  
  // Format time from timestamp for trades
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
  
  // Calculate total (cumulative) for each row
  const asksWithTotal = useMemo(() => {
    let cumulative = 0;
    return [...asks].reverse().slice(0, 12).map(ask => {
      cumulative += ask.amount;
      return { ...ask, total: cumulative };
    }).reverse();
  }, [asks]);
  
  const bidsWithTotal = useMemo(() => {
    let cumulative = 0;
    return bids.slice(0, 12).map(bid => {
      cumulative += bid.amount;
      return { ...bid, total: cumulative };
    });
  }, [bids]);
  
  // Max amount for bar width calculation
  const maxAmount = useMemo(() => Math.max(
    ...asksWithTotal.map(a => a.amount),
    ...bidsWithTotal.map(b => b.amount),
    1
  ), [asksWithTotal, bidsWithTotal]);
  
  // Spread calculation
  const spreadData = useMemo(() => {
    if (!bids.length || !asks.length) return { value: '--', percent: '--' };
    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;
    const spreadValue = bestAsk - bestBid;
    const spreadPercent = ((spreadValue / bestAsk) * 100).toFixed(3);
    return { 
      value: spreadValue.toFixed(1), 
      percent: spreadPercent 
    };
  }, [bids, asks]);
  
  const coinSymbol = selectedSymbol ? selectedSymbol.split('/')[0] : 'BTC';
  
  return (
    <div className="card orderbook-hl-container">
      {/* Header with Tabs and Controls */}
      <div className="orderbook-hl-header">
        <div className="orderbook-tabs">
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
        
        <div className="orderbook-controls">
          <select 
            className="control-select" 
            value={grouping}
            onChange={(e) => setGrouping(e.target.value)}
          >
            <option value="0.01">0.01</option>
            <option value="0.1">0.1</option>
            <option value="1">1</option>
            <option value="10">10</option>
          </select>
          
          <div className="symbol-dropdown-container" ref={dropdownRef}>
            <button 
              className="control-select symbol-select"
              onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
              type="button"
            >
              <img 
                src={iconMap[coinSymbol] || btcIcon} 
                alt={coinSymbol}
                className="symbol-icon"
              />
              <span>{coinSymbol}</span>
              <span className="dropdown-arrow">▾</span>
            </button>
            
            {showSymbolDropdown && (
              <div className="symbol-dropdown-menu">
                {tickers && tickers.length > 0 ? (
                  tickers.map(ticker => {
                    const symbol = ticker.symbol.split('/')[0];
                    return (
                      <div
                        key={ticker.symbol}
                        className={`symbol-dropdown-item ${selectedSymbol === ticker.symbol ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedSymbol(ticker.symbol);
                          setShowSymbolDropdown(false);
                        }}
                      >
                        <img 
                          src={iconMap[symbol] || btcIcon} 
                          alt={symbol}
                          className="symbol-icon"
                        />
                        <span className="symbol-name">{symbol}</span>
                        <span className="symbol-pair">/{ticker.symbol.split('/')[1]}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="symbol-dropdown-item">
                    <img 
                      src={iconMap[coinSymbol] || btcIcon} 
                      alt={coinSymbol}
                      className="symbol-icon"
                    />
                    <span>{coinSymbol}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button className="control-menu-btn">⋮</button>
        </div>
      </div>
      
      {/* Order Book Table */}
      {activeTab === 'orderbook' && (
        <div className="orderbook-hl-body">
          <div className="orderbook-table-header">
            <span>Price</span>
            <span>Size ({coinSymbol})</span>
            <span>Total ({coinSymbol})</span>
          </div>
          
          <div className="orderbook-table-content">
            {/* Asks (Sell Orders - Red) */}
            <div className="asks-section">
              {asksWithTotal.map((ask, i) => (
                <div key={`ask-${i}`} className="orderbook-row ask-row">
                  <div className="depth-bar ask-bar" style={{ width: `${(ask.amount / maxAmount) * 100}%` }} />
                  <span className="price ask-price">{ask.price.toFixed(1)}</span>
                  <span className="size">{ask.amount.toFixed(4)}</span>
                  <span className="total">{ask.total.toFixed(4)}</span>
                </div>
              ))}
            </div>
            
            {/* Spread Row */}
            <div className="spread-row">
              <span className="spread-value">{spreadData.value}</span>
              <span className="spread-percent">{spreadData.percent}%</span>
            </div>
            
            {/* Bids (Buy Orders - Green) */}
            <div className="bids-section">
              {bidsWithTotal.map((bid, i) => (
                <div key={`bid-${i}`} className="orderbook-row bid-row">
                  <div className="depth-bar bid-bar" style={{ width: `${(bid.amount / maxAmount) * 100}%` }} />
                  <span className="price bid-price">{bid.price.toFixed(1)}</span>
                  <span className="size">{bid.amount.toFixed(4)}</span>
                  <span className="total">{bid.total.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Trades Tab */}
      {activeTab === 'trades' && (
        <div className="orderbook-hl-body">
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
    </div>
  );
};

export default OrderBook;
