import React, { useState, useRef, useEffect } from 'react';
import { useTradingData } from './context/HyperliquidTradingProvider';
import { useWallet } from '../../../context/WalletContext.js';
import { useUserBalance } from '../../../hooks/useUserBalance.js';
import './TradingControls.css';

const TradingControls = ({ orderConfig, setOrderConfig }) => {
  const { 
    selectedSymbol, 
    orderBook, 
    tickers, 
    selectedPrice, 
    setSelectedPrice
  } = useTradingData();
  const { isConnected, connectWallet, isConnecting } = useWallet();
  const { balance } = useUserBalance();
  
  const [showMarginDropdown, setShowMarginDropdown] = useState(false);
  const marginDropdownRef = useRef(null);
  const [showOrderTypeDropdown, setShowOrderTypeDropdown] = useState(false);
  const orderTypeDropdownRef = useRef(null);
  
  // Use shared config from props
  const {
    orderType,
    price,
    amount,
    marginMode,
    leverage,
    tpSl,
    hiddenOrder,
    reduceOnly,
    timeInForce
  } = orderConfig || {};
  
  // Helper functions to update config
  const updateConfig = (updates) => {
    if (setOrderConfig) {
      setOrderConfig(prev => ({ ...prev, ...updates }));
    }
  };
  
  const currentTicker = tickers?.find(t => t.symbol === selectedSymbol) || { last: 0 };
  const bestBid = orderBook?.bids?.[0]?.price || 0;
  const bestAsk = orderBook?.asks?.[0]?.price || 0;
  const midPrice = bestBid && bestAsk ? ((bestBid + bestAsk) / 2) : currentTicker.last;
  
  // Available balance
  const availableBalance = balance || 0;

  // Close margin dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (marginDropdownRef.current && !marginDropdownRef.current.contains(event.target)) {
        setShowMarginDropdown(false);
      }
      if (orderTypeDropdownRef.current && !orderTypeDropdownRef.current.contains(event.target)) {
        setShowOrderTypeDropdown(false);
      }
    };
    
    if (showMarginDropdown || showOrderTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMarginDropdown, showOrderTypeDropdown]);

  // Set price when selected from order book
  useEffect(() => {
    if (selectedPrice && orderType === 'limit') {
      updateConfig({ price: selectedPrice.toFixed(2) });
      setSelectedPrice(null);
    }
  }, [selectedPrice, orderType, setSelectedPrice]);

  // Set default price
  useEffect(() => {
    if (orderType === 'market') {
      updateConfig({ price: '' });
    } else if (!price && midPrice > 0) {
      updateConfig({ price: midPrice.toFixed(2) });
    }
  }, [orderType, midPrice, price]);

  const handlePriceClick = (priceValue) => {
    if (orderType === 'limit' && priceValue > 0) {
      updateConfig({ price: priceValue.toFixed(2) });
    }
  };

  const handleSliderChange = (percentage) => {
    if (!availableBalance || availableBalance <= 0) return;
    
    const orderPrice = orderType === 'market' ? midPrice : (parseFloat(price) || midPrice);
    if (!orderPrice || orderPrice <= 0) return;
    
    // Calculate max amount based on available balance and price
    const maxAmount = availableBalance / orderPrice;
    const calculatedAmount = (maxAmount * percentage / 100);
    updateConfig({ amount: calculatedAmount.toFixed(4) });
  };

  // Expose orderType and other values to parent component if needed
  // The actual order submission will be handled by OrderForm

  return (
    <div className="trading-controls-container">
      {/* Margin Controls - Cross, 20x, M */}
      <div className="trading-margin-controls">
        <div className="margin-controls-container" ref={marginDropdownRef}>
          <button
            className="margin-control-btn cross-btn"
            onClick={() => setShowMarginDropdown(!showMarginDropdown)}
            type="button"
          >
            <span>{marginMode || 'Cross'}</span>
            <span className="dropdown-arrow">▾</span>
          </button>
          
          {showMarginDropdown && (
            <div className="margin-control-dropdown">
              <div
                className={`margin-control-option ${marginMode === 'Cross' ? 'active' : ''}`}
                onClick={() => {
                  updateConfig({ marginMode: 'Cross' });
                  setShowMarginDropdown(false);
                }}
              >
                Cross
              </div>
              <div
                className={`margin-control-option ${marginMode === 'Isolated' ? 'active' : ''}`}
                onClick={() => {
                  updateConfig({ marginMode: 'Isolated' });
                  setShowMarginDropdown(false);
                }}
              >
                Isolated
              </div>
            </div>
          )}
        </div>
        <button className="margin-control-btn leverage-btn">20x</button>
        <button className="margin-control-btn menu-btn">M</button>
      </div>

      {/* Order Type Tabs - Market, Limit, Stop Limit */}
      <div className="trading-order-type-tabs">
        <button
          type="button"
          className={`order-type-tab ${orderType === 'market' ? 'active' : ''}`}
          onClick={() => updateConfig({ orderType: 'market' })}
        >
          Market
        </button>
        <button
          type="button"
          className={`order-type-tab ${orderType === 'limit' ? 'active' : ''}`}
          onClick={() => updateConfig({ orderType: 'limit' })}
        >
          Limit
        </button>
        <div className="order-type-tab stop-limit-tab" ref={orderTypeDropdownRef}>
          <div className="stop-limit-tab-wrapper">
            <button
              type="button"
              className={`order-type-tab ${orderType === 'stop-limit' || orderType === 'stop-market' || orderType === 'trailing-stop' || orderType === 'post-only' ? 'active' : ''}`}
              onClick={() => setShowOrderTypeDropdown(!showOrderTypeDropdown)}
            >
              {orderType === 'stop-limit' ? 'Stop Limit' : 
               orderType === 'stop-market' ? 'Stop Market' :
               orderType === 'trailing-stop' ? 'Trailing Stop' :
               orderType === 'post-only' ? 'Post Only' : 'Stop Limit'}
              <span className="dropdown-arrow">▾</span>
            </button>
            {(orderType === 'stop-limit' || orderType === 'stop-market' || orderType === 'trailing-stop' || orderType === 'post-only') && (
              <span 
                className="order-type-info-icon" 
                title={
                  orderType === 'stop-limit' 
                    ? 'Stop Limit Orders execute when a specified stop price is reached. Specify a trigger price to activate the order.'
                    : orderType === 'stop-market'
                    ? 'Stop Market Orders execute immediately at market price when the stop price is reached. Faster execution than Stop Limit.'
                    : orderType === 'trailing-stop'
                    ? 'Trailing Stop Orders follow the price at a fixed distance. If price rises, the stop adjusts upward. Protects profits while allowing gains.'
                    : 'Post Only Orders are placed as maker orders only. If the order would execute immediately as taker, it is rejected. Earn maker fees.'
                }
              >
                ℹ️
              </span>
            )}
          </div>
          {showOrderTypeDropdown && (
            <div className="order-type-dropdown">
              <div
                className={`order-type-option ${orderType === 'stop-limit' ? 'active' : ''}`}
                onClick={() => {
                  updateConfig({ orderType: 'stop-limit' });
                  setShowOrderTypeDropdown(false);
                }}
              >
                Stop Limit
              </div>
              <div
                className={`order-type-option ${orderType === 'stop-market' ? 'active' : ''}`}
                onClick={() => {
                  updateConfig({ orderType: 'stop-market' });
                  setShowOrderTypeDropdown(false);
                }}
              >
                Stop Market
              </div>
              <div
                className={`order-type-option ${orderType === 'trailing-stop' ? 'active' : ''}`}
                onClick={() => {
                  updateConfig({ orderType: 'trailing-stop' });
                  setShowOrderTypeDropdown(false);
                }}
              >
                Trailing Stop
              </div>
              <div
                className={`order-type-option ${orderType === 'post-only' ? 'active' : ''}`}
                onClick={() => {
                  updateConfig({ orderType: 'post-only' });
                  setShowOrderTypeDropdown(false);
                }}
              >
                Post Only
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Form Content */}
      <div className="trading-controls-body">
        {/* Available Balance */}
        <div className="available-balance">
          <span>Avbl {availableBalance.toFixed(2)} USDT</span>
          <button className="plus-icon-btn" type="button" title="Deposit">+</button>
        </div>

        {/* Price Input (for Limit and Post Only orders) */}
        {(orderType === 'limit' || orderType === 'post-only') && (
          <div className="trading-input-group">
            <label className="trading-label">Price (USDT)</label>
            <div className="price-input-wrapper">
              <input
                type="number"
                className="trading-input price-input"
                placeholder="0.00"
                value={price || ''}
                onChange={(e) => updateConfig({ price: e.target.value })}
                step="0.01"
              />
              <span className="currency-label">USDT</span>
              <button 
                className="bbo-btn" 
                type="button" 
                onClick={() => handlePriceClick(midPrice)}
                title="Use Best Bid/Ask"
              >
                BBO
              </button>
            </div>
          </div>
        )}

        {/* Stop Price Input (for Stop Limit and Stop Market orders) */}
        {(orderType === 'stop-limit' || orderType === 'stop-market') && (
          <>
            <div className="trading-input-group">
              <label className="trading-label">
                Stop Price (USDT)
                <span className="info-icon-tooltip-inline" title="The price at which the stop order will be triggered">ℹ️</span>
              </label>
              <div className="price-input-wrapper">
                <input
                  type="number"
                  className="trading-input price-input"
                  placeholder="0.00"
                  value={orderConfig?.stopPrice || ''}
                  onChange={(e) => updateConfig({ stopPrice: e.target.value })}
                  step="0.01"
                />
                <span className="currency-label">USDT</span>
                <button 
                  className="bbo-btn" 
                  type="button" 
                  onClick={() => updateConfig({ stopPrice: midPrice.toFixed(2) })}
                  title="Use Current Price"
                >
                  Current
                </button>
              </div>
            </div>
            {orderType === 'stop-limit' && (
              <div className="trading-input-group">
                <label className="trading-label">
                  Limit Price (USDT)
                  <span className="info-icon-tooltip-inline" title="The price at which the order will execute after the stop is triggered">ℹ️</span>
                </label>
                <div className="price-input-wrapper">
                  <input
                    type="number"
                    className="trading-input price-input"
                    placeholder="0.00"
                    value={price || ''}
                    onChange={(e) => updateConfig({ price: e.target.value })}
                    step="0.01"
                  />
                  <span className="currency-label">USDT</span>
                  <button 
                    className="bbo-btn" 
                    type="button" 
                    onClick={() => handlePriceClick(midPrice)}
                    title="Use Best Bid/Ask"
                  >
                    BBO
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Trailing Stop Input */}
        {orderType === 'trailing-stop' && (
          <div className="trading-input-group">
            <label className="trading-label">
              Trailing Distance (%)
              <span className="info-icon-tooltip-inline" title="The percentage distance the stop will trail behind the current price">ℹ️</span>
            </label>
            <div className="price-input-wrapper">
              <input
                type="number"
                className="trading-input price-input"
                placeholder="5.00"
                value={orderConfig?.trailingPercent || ''}
                onChange={(e) => updateConfig({ trailingPercent: e.target.value })}
                step="0.01"
                min="0.01"
                max="100"
              />
              <span className="currency-label">%</span>
            </div>
          </div>
        )}

        {/* Size Input */}
        <div className="trading-input-group">
          <label className="trading-label">Size</label>
          <div className="size-input-wrapper">
            <input
              type="number"
              className="trading-input size-input"
              placeholder="0.0000"
              value={amount || ''}
              onChange={(e) => updateConfig({ amount: e.target.value })}
              step="0.0001"
            />
            <select className="currency-select" defaultValue="USDT">
              <option value="USDT">USDT</option>
            </select>
          </div>
          
          {/* Slider */}
          {availableBalance > 0 && (
            <div className="size-slider-container">
              <input
                type="range"
                className="size-slider"
                min="0"
                max="100"
                value={(() => {
                  if (!amount || !availableBalance) return 0;
                  const orderPrice = orderType === 'market' ? midPrice : (parseFloat(price) || midPrice);
                  if (!orderPrice || orderPrice <= 0) return 0;
                  const maxAmount = availableBalance / orderPrice;
                  return maxAmount > 0 ? Math.min((parseFloat(amount) / maxAmount * 100), 100) : 0;
                })()}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
              />
              <div className="slider-markers">
                <span className="marker" onClick={() => handleSliderChange(25)} title="25%"></span>
                <span className="marker" onClick={() => handleSliderChange(50)} title="50%"></span>
                <span className="marker" onClick={() => handleSliderChange(75)} title="75%"></span>
                <span className="marker" onClick={() => handleSliderChange(100)} title="100%"></span>
              </div>
            </div>
          )}
        </div>

        {/* Checkboxes */}
        <div className="trading-options">
          <label className="option-checkbox">
            <input
              type="checkbox"
              checked={tpSl || false}
              onChange={(e) => updateConfig({ tpSl: e.target.checked })}
            />
            <span>TP/SL</span>
          </label>
          <label className="option-checkbox">
            <input
              type="checkbox"
              checked={hiddenOrder || false}
              onChange={(e) => updateConfig({ hiddenOrder: e.target.checked })}
            />
            <span>Hidden Order</span>
          </label>
          <div className="reduce-only-wrapper">
            <label className="option-checkbox">
              <input
                type="checkbox"
                checked={reduceOnly || false}
                onChange={(e) => updateConfig({ reduceOnly: e.target.checked })}
              />
              <span>Reduce-Only</span>
            </label>
            <select
              className="gtc-select"
              value={timeInForce || 'GTC'}
              onChange={(e) => updateConfig({ timeInForce: e.target.value })}
            >
              <option value="GTC">GTC</option>
              <option value="IOC">IOC</option>
              <option value="FOK">FOK</option>
            </select>
          </div>
        </div>

        {/* Connect Wallet Button */}
        {!isConnected && (
          <button
            type="button"
            className="connect-wallet-btn"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect wallet'}
          </button>
        )}

        {/* Account Info - Two Columns */}
        <div className="account-info-grid">
          <div className="account-info-column">
            <div className="info-item">
              <span className="info-label">Liq.Price</span>
              <span className="info-value">--</span>
            </div>
            <div className="info-item">
              <span className="info-label">Margin</span>
              <span className="info-value positive">0.00</span>
            </div>
            <div className="info-item">
              <span className="info-label">Max</span>
              <span className="info-value positive">0.00 USDT</span>
            </div>
          </div>
          <div className="account-info-column">
            <div className="info-item">
              <span className="info-label">Liq.Price</span>
              <span className="info-value">--</span>
            </div>
            <div className="info-item">
              <span className="info-label">Margin</span>
              <span className="info-value negative">0.00</span>
            </div>
            <div className="info-item">
              <span className="info-label">Max</span>
              <span className="info-value negative">0.00 USDT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingControls;

