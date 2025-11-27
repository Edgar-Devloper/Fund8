import React, { useState, useEffect, useRef } from 'react';
import { useTradingData } from './context/HyperliquidTradingProvider';
import './TradingPairHeader.css';

const TradingPairHeader = () => {
  const { selectedSymbol, tickers, setSelectedSymbol } = useTradingData();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const selectorRef = useRef(null);

  // Encontrar el ticker actual
  const currentTicker = tickers?.find(t => t.symbol === selectedSymbol) || {
    symbol: 'BTC/USDC',
    last: 0,
    change24h: 0,
    change24hPercent: 0,
    volume24h: 0,
    high24h: 0,
    low24h: 0,
    marketCap: 0
  };

  // Usar el porcentaje de cambio ya calculado
  const changePercent = (currentTicker.change24hPercent || 0).toFixed(2);
  const isPositive = parseFloat(currentTicker.change24h) >= 0;

  // Formatear números grandes (volumen, market cap)
  const formatLargeNumber = (num) => {
    if (!num) return '$0';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Market cap viene del ticker ahora
  const marketCap = currentTicker.marketCap || 0;

  const toggleDropdown = (e) => {
    if (e) {
      e.stopPropagation();
    }
    console.log('Toggle dropdown, current state:', showDropdown);
    setShowDropdown(prev => !prev);
  };

  const closeDropdown = (e) => {
    if (e) {
      e.stopPropagation();
    }
    console.log('Close dropdown');
    setShowDropdown(false);
  };

  const handleItemClick = (symbol, e) => {
    if (e) {
      e.stopPropagation();
    }
    console.log('Select pair:', symbol);
    setSelectedSymbol(symbol);
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        selectorRef.current &&
        !selectorRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      // Add delay to prevent immediate close
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showDropdown]);

  return (
    <div className="trading-pair-header">
      {/* Pair Selector */}
      <div className={`pair-selector-container ${showDropdown ? 'dropdown-open' : ''}`}>
        {/* Overlay for mobile */}
        {showDropdown && (
          <div 
            className="dropdown-overlay-mobile" 
            onClick={closeDropdown}
          />
        )}
        
        <button 
          ref={selectorRef}
          className="pair-selector" 
          onClick={toggleDropdown}
          type="button"
          style={{ 
            cursor: 'pointer', 
            userSelect: 'none', 
            WebkitTapHighlightColor: 'transparent',
            border: 'none',
            outline: 'none'
          }}
        >
          <span className="pair-symbol">{currentTicker.symbol}</span>
          <span className="pair-badge">Spot</span>
          <span className="pair-arrow">▾</span>
          <span className="pair-star">⭐</span>
        </button>

        {showDropdown && (
          <div ref={dropdownRef} className="pair-dropdown">
            <div className="dropdown-header">
              <input 
                type="text" 
                placeholder="Search pairs..." 
                className="dropdown-search"
              />
            </div>
            <div className="dropdown-list">
              {tickers?.slice(0, 10).map(ticker => {
                const changePercent = (ticker.change24hPercent || 0).toFixed(2);
                const isPositive = parseFloat(changePercent) >= 0;
                
                return (
                  <button 
                    key={ticker.symbol}
                    className="dropdown-item"
                    onClick={(e) => handleItemClick(ticker.symbol, e)}
                    type="button"
                    style={{ 
                      cursor: 'pointer', 
                      userSelect: 'none', 
                      WebkitTapHighlightColor: 'transparent',
                      border: 'none',
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent'
                    }}
                  >
                    <div className="item-left">
                      <span className="item-symbol">{ticker.symbol}</span>
                      <span className="item-price">${ticker.last.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <span className={`item-change ${isPositive ? 'positive' : 'negative'}`}>
                      {isPositive ? '+' : ''}{changePercent}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Current Price */}
      <div className="price-display">
        <span className="price-label">Price</span>
        <span className="price-value">${currentTicker.last.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>

      {/* 24h Change */}
      <div className="stat-item">
        <div className="stat-label">24h Change</div>
        <div className={`stat-value ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{currentTicker.change24h.toFixed(2)} / {isPositive ? '+' : ''}{changePercent}%
        </div>
      </div>

      {/* 24h High */}
      <div className="stat-item">
        <div className="stat-label">24h High</div>
        <div className="stat-value">${(currentTicker.high24h || currentTicker.last).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>

      {/* 24h Low */}
      <div className="stat-item">
        <div className="stat-label">24h Low</div>
        <div className="stat-value">${(currentTicker.low24h || currentTicker.last).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>

      {/* 24h Volume */}
      <div className="stat-item">
        <div className="stat-label">24h Volume</div>
        <div className="stat-value">{formatLargeNumber(currentTicker.volume24h)}</div>
      </div>

      {/* Market Cap */}
      <div className="stat-item">
        <div className="stat-label">Market Cap</div>
        <div className="stat-value">{formatLargeNumber(marketCap)}</div>
      </div>

      {/* Data Source Indicator */}
      <div className="data-source-indicator">
        <div className="source-badge">
          <span className="source-dot"></span>
          <span className="source-text">Hyperliquid</span>
        </div>
      </div>
    </div>
  );
};

export default TradingPairHeader;

