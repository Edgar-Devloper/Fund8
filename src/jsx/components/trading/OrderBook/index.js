import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useTradingData } from '../context/HyperliquidTradingProvider';
import { useTranslation } from 'react-i18next';
// import DepositModal from '../DepositModal';
// import WithdrawModal from '../WithdrawModal';
// import '../DepositModal.css';
// import '../WithdrawModal.css';
import './OrderBook.css';
import '../animations.css';

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
  const { orderBook, selectedSymbol, trades, tickers, setSelectedSymbol, setSelectedPrice } = useTradingData();
  const { t } = useTranslation(); // eslint-disable-line
  const { bids = [], asks = [] } = orderBook || {};
  
  // Debug: Log bids and asks
  useEffect(() => {
    console.log('[OrderBook] Bids:', bids.length, bids);
    console.log('[OrderBook] Asks:', asks.length, asks);
  }, [bids, asks]);
  
  const [activeTab, setActiveTab] = useState('orderbook'); // 'orderbook' | 'trades'
  const [grouping, setGrouping] = useState('0.1');
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
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
  
  // Get decimal places for price based on grouping
  const getPriceDecimals = (groupingValue) => {
    const g = parseFloat(groupingValue);
    if (g >= 10) return 0;
    if (g >= 1) return 1;
    if (g >= 0.1) return 1;
    if (g >= 0.01) return 2;
    return 2;
  };
  
  const priceDecimals = getPriceDecimals(grouping);
  
  // Group orders by price according to grouping value
  const groupOrders = (orders, groupingValue) => {
    if (!orders || orders.length === 0) return [];
    
    const grouping = parseFloat(groupingValue);
    const grouped = {};
    
    orders.forEach(order => {
      // Round price to nearest grouping value
      const roundedPrice = Math.floor(order.price / grouping) * grouping;
      
      if (!grouped[roundedPrice]) {
        grouped[roundedPrice] = {
          price: roundedPrice,
          amount: 0
        };
      }
      
      grouped[roundedPrice].amount += order.amount;
    });
    
    // Convert to array and sort
    return Object.values(grouped);
  };
  
  // Apply grouping to bids and asks
  const groupedBids = useMemo(() => {
    return groupOrders(bids, grouping);
  }, [bids, grouping]);
  
  const groupedAsks = useMemo(() => {
    return groupOrders(asks, grouping);
  }, [asks, grouping]);
  
  // Calculate total (cumulative) for each row
  const asksWithTotal = useMemo(() => {
    let cumulative = 0;
    return [...groupedAsks].reverse().slice(0, 12).map(ask => {
      cumulative += ask.amount;
      return { ...ask, total: cumulative };
    }).reverse();
  }, [groupedAsks]);
  
  const bidsWithTotal = useMemo(() => {
    let cumulative = 0;
    return groupedBids.slice(0, 12).map(bid => {
      cumulative += bid.amount;
      return { ...bid, total: cumulative };
    });
  }, [groupedBids]);
  
  // Max total for bar width calculation (cumulative total)
  const maxTotal = useMemo(() => Math.max(
    ...asksWithTotal.map(a => a.total),
    ...bidsWithTotal.map(b => b.total),
    1
  ), [asksWithTotal, bidsWithTotal]);
  
  // Spread calculation (using original data for best bid/ask, not grouped)
  const spreadData = useMemo(() => {
    if (!bids.length || !asks.length) return { value: '--', percent: '--' };
    
    // Use original bids/asks to get real best prices (not grouped)
    // Best bid = highest buy price (first in array, already sorted descending)
    // Best ask = lowest sell price (first in array, already sorted ascending)
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    
    if (bestBid === 0 || bestAsk === 0) return { value: '--', percent: '--' };
    
    // Spread = difference between best ask and best bid
    const spreadValue = bestAsk - bestBid;
    // Spread percentage = (spread / ask price) * 100
    const spreadPercent = ((spreadValue / bestAsk) * 100);
    
    // Debug log
    console.log('[OrderBook Spread]', {
      bestBid,
      bestAsk,
      spreadValue,
      spreadPercent: `${spreadPercent.toFixed(3)}%`,
      formattedValue: spreadValue.toFixed(2)
    });
    
    return { 
      value: spreadValue.toFixed(2), // Always show 2 decimal places
      percent: spreadPercent.toFixed(3) // Show 3 decimal places for percentage
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
            type="button"
          >
            Order Book
          </button>
          <button 
            className={`tab-btn ${activeTab === 'trades' ? 'active' : ''}`}
            onClick={() => setActiveTab('trades')}
            type="button"
          >
            Trades
          </button>
        </div>
        
        <div className="orderbook-controls">
          {/* Grouping selector - only show in Order Book tab */}
          {activeTab === 'orderbook' && (
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
          )}
          
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
            <span>PRICE</span>
            <span>SIZE ({coinSymbol})</span>
            <span>TOTAL ({coinSymbol})</span>
          </div>
          
          <div className="orderbook-table-content">
            {/* Asks (Sell Orders - Red) */}
            <div className="asks-section">
              {asksWithTotal.map((ask, i) => (
                <div 
                  key={`ask-${i}`} 
                  className="orderbook-row ask-row"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (setSelectedPrice && typeof setSelectedPrice === 'function') {
                      setSelectedPrice(ask.price);
                      console.log('[OrderBook] Selected price:', ask.price);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="depth-bar ask-bar" style={{ width: `${(ask.total / maxTotal) * 100}%` }} />
                  <span className="price ask-price animated-number">{ask.price.toFixed(priceDecimals)}</span>
                  <span className="size animated-number">{ask.amount.toFixed(4)}</span>
                  <span className="total animated-number">{ask.total.toFixed(4)}</span>
                </div>
              ))}
            </div>
            
            {/* Spread Row */}
            <div className="spread-row">
              <span className="spread-label">SPREAD</span>
              <span className="spread-value">{spreadData.value}</span>
              <span className="spread-percent">{spreadData.percent}%</span>
            </div>
            
            {/* Bids (Buy Orders - Green) */}
            <div className="bids-section">
              {bidsWithTotal.map((bid, i) => (
                <div 
                  key={`bid-${i}`} 
                  className="orderbook-row bid-row"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (setSelectedPrice && typeof setSelectedPrice === 'function') {
                      setSelectedPrice(bid.price);
                      console.log('[OrderBook] Selected price:', bid.price);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="depth-bar bid-bar" style={{ width: `${(bid.total / maxTotal) * 100}%` }} />
                  <span className="price bid-price animated-number">{bid.price.toFixed(priceDecimals)}</span>
                  <span className="size animated-number">{bid.amount.toFixed(4)}</span>
                  <span className="total animated-number">{bid.total.toFixed(4)}</span>
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
                    <span className={`price animated-number ${trade.side === 'buy' ? 'buy-price' : 'sell-price'}`}>
                      {typeof trade.price === 'number' ? trade.price.toFixed(1) : trade.price}
                    </span>
                    <span className="size animated-number slide-in-new">
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
      
      {/* {activeTab === 'orderbook' && (
        <div className="orderbook-hl-footer">
          <button 
            className="deposit-btn"
            onClick={() => setShowDepositModal(true)}
          >
            Deposit
          </button>
          <div className="footer-actions">
            <button 
              className="perps-spot-btn"
              onClick={() => {
                // TODO: Implement Perps <-> Spot toggle functionality
                console.log('Perps <-> Spot clicked (not implemented yet)');
              }}
            >
              <span>Perps</span>
              <span className="arrow-icon">↔</span>
              <span>Spot</span>
            </button>
            <button 
              className="withdraw-btn"
              onClick={() => setShowWithdrawModal(true)}
            >
              Withdraw
            </button>
          </div>
        </div>
      )} */}

      {/* {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} />
      )}
      {showWithdrawModal && (
        <WithdrawModal onClose={() => setShowWithdrawModal(false)} />
      )} */}
    </div>
  );
};

export default OrderBook;
