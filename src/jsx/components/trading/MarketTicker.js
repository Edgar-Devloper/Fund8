import React, { useState, useEffect, useRef } from 'react';
import { useTradingData } from './context/HyperliquidTradingProvider';
import './MarketTicker.css';

const MarketTicker = () => {
  const { tickers = [], setSelectedSymbol = () => {} } = useTradingData();
  const [scrollPosition, setScrollPosition] = useState(0);
  const tickerRef = useRef(null);
  const animationRef = useRef(null);
  const prevPricesRef = useRef({});

  // Animate price changes
  useEffect(() => {
    if (tickers && tickers.length > 0) {
      tickers.forEach(ticker => {
        const key = ticker.symbol;
        const prevPrice = prevPricesRef.current[key];
        const currentPrice = ticker.last;

        if (prevPrice && prevPrice !== currentPrice) {
          const element = document.querySelector(`[data-ticker-symbol="${key}"]`);
          if (element) {
            const priceElement = element.querySelector('.ticker-price');
            if (priceElement) {
              priceElement.classList.remove('price-up', 'price-down');
              priceElement.classList.add(currentPrice > prevPrice ? 'price-up' : 'price-down');
              setTimeout(() => {
                priceElement.classList.remove('price-up', 'price-down');
              }, 500);
            }
          }
        }
        prevPricesRef.current[key] = currentPrice;
      });
    }
  }, [tickers]);

  // Auto-scroll ticker
  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    const scroll = () => {
      setScrollPosition(prev => {
        const maxScroll = ticker.scrollWidth - ticker.clientWidth;
        if (maxScroll <= 0) return 0;
        
        const newPosition = prev + 1;
        if (newPosition >= maxScroll) {
          return 0; // Reset to start
        }
        return newPosition;
      });
    };

    const interval = setInterval(scroll, 30); // Smooth scroll
    return () => clearInterval(interval);
  }, [tickers]);

  useEffect(() => {
    if (tickerRef.current) {
      tickerRef.current.scrollLeft = scrollPosition;
    }
  }, [scrollPosition]);

  if (!tickers || tickers.length === 0) {
    return null;
  }

  const formatPrice = (price) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toFixed(4);
  };

  const formatChange = (change) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <div className="market-ticker-container">
      <div className="market-ticker" ref={tickerRef}>
        {tickers.map((ticker, index) => {
          // Use change24hPercent if available, otherwise calculate from change24h
          const changePercent = ticker.change24hPercent !== undefined 
            ? ticker.change24hPercent 
            : (ticker.change24h && ticker.last ? ((ticker.change24h / (ticker.last - ticker.change24h)) * 100) : 0);
          const isPositive = changePercent >= 0;
          return (
            <div
              key={`${ticker.symbol}-${index}`}
              data-ticker-symbol={ticker.symbol}
              className="ticker-item"
              onClick={() => setSelectedSymbol(ticker.symbol)}
            >
              <span className="ticker-symbol">{ticker.symbol}</span>
              <span className={`ticker-price animated-number ${isPositive ? 'positive' : 'negative'}`}>
                {formatPrice(ticker.last)}
              </span>
              <span className={`ticker-change ${isPositive ? 'positive' : 'negative'}`}>
                {formatChange(changePercent)}
              </span>
            </div>
          );
        })}
        {/* Duplicate for seamless loop */}
        {tickers.map((ticker, index) => {
          // Use change24hPercent if available, otherwise calculate from change24h
          const changePercent = ticker.change24hPercent !== undefined 
            ? ticker.change24hPercent 
            : (ticker.change24h && ticker.last ? ((ticker.change24h / (ticker.last - ticker.change24h)) * 100) : 0);
          const isPositive = changePercent >= 0;
          return (
            <div
              key={`${ticker.symbol}-dup-${index}`}
              data-ticker-symbol={ticker.symbol}
              className="ticker-item"
              onClick={() => setSelectedSymbol(ticker.symbol)}
            >
              <span className="ticker-symbol">{ticker.symbol}</span>
              <span className={`ticker-price animated-number ${isPositive ? 'positive' : 'negative'}`}>
                {formatPrice(ticker.last)}
              </span>
              <span className={`ticker-change ${isPositive ? 'positive' : 'negative'}`}>
                {formatChange(changePercent)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketTicker;

