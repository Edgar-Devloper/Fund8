import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../../../context/WalletContext';
import hyperliquidTrading from '../../../services/hyperliquidTrading';
import { useTranslation } from 'react-i18next';
import './ActivePositionsPanel.css';
import './animations.css';

const ActivePositionsPanel = () => {
  const { t } = useTranslation();
  const { isConnected, address } = useWallet();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [closingPosition, setClosingPosition] = useState(null);
  const prevPositionsRef = useRef([]);

  useEffect(() => {
    if (!isConnected || !address) {
      setPositions([]);
      return;
    }

    const fetchPositions = async () => {
      setLoading(true);
      try {
        const userState = await hyperliquidTrading.getUserState(address);
        if (userState && userState.assetPositions) {
          const activePositions = userState.assetPositions.filter(
            pos => parseFloat(pos.position.szi) !== 0
          );
          
          // Check for changes to trigger animations
          if (JSON.stringify(prevPositionsRef.current) !== JSON.stringify(activePositions)) {
            prevPositionsRef.current = activePositions;
          }
          setPositions(activePositions);
        } else {
          setPositions([]);
        }
      } catch (error) {
        console.error('[ActivePositionsPanel] Error fetching positions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
    
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchPositions, 5000);
    
    return () => clearInterval(interval);
  }, [isConnected, address]);

  const handleClosePosition = async (position) => {
    if (!position || closingPosition) return;
    
    const coin = position.position.coin;
    const size = Math.abs(parseFloat(position.position.szi));
    const isLong = parseFloat(position.position.szi) > 0;
    
    // Confirm before closing
    const confirmMsg = `Close ${isLong ? 'LONG' : 'SHORT'} position of ${size} ${coin}?`;
    if (!window.confirm(confirmMsg)) return;
    
    setClosingPosition(coin);
    
    try {
      // Close position = create market order in opposite direction
      const result = await hyperliquidTrading.placeMarketOrder({
        coin: coin,
        isBuy: !isLong, // Opposite direction
        size: size
      });

      if (result.success) {
        // Refresh positions
        const userState = await hyperliquidTrading.getUserState(address);
        if (userState && userState.assetPositions) {
          const activePositions = userState.assetPositions.filter(
            pos => parseFloat(pos.position.szi) !== 0
          );
          setPositions(activePositions);
        }
      } else {
        alert(`Failed to close position: ${result.error}`);
      }
    } catch (error) {
      console.error('[ActivePositionsPanel] Error closing position:', error);
      alert(`Error closing position: ${error.message}`);
    } finally {
      setClosingPosition(null);
    }
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };

  const formatSize = (size) => {
    const num = parseFloat(size);
    if (isNaN(num)) return '0.0000';
    return num.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  };

  const formatPnl = (pnl) => {
    const num = parseFloat(pnl);
    if (isNaN(num)) return '$0.00';
    const sign = num >= 0 ? '+' : '';
    return `${sign}$${num.toFixed(2)}`;
  };

  if (!isConnected) {
    return (
      <div className="active-positions-panel">
        <div className="positions-empty">
          <p>Connect your wallet to view positions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="active-positions-panel">
      <div className="positions-header">
        <h6 className="positions-title">Active Positions</h6>
        {positions.length > 0 && (
          <span className="positions-count">{positions.length}</span>
        )}
      </div>

      <div className="positions-content">
        {loading && positions.length === 0 ? (
          <div className="positions-loading">
            <div className="spinner"></div>
            <span>Loading...</span>
          </div>
        ) : positions.length === 0 ? (
          <div className="positions-empty">
            <p>No open positions</p>
          </div>
        ) : (
          <div className="positions-list">
            {positions.map((position, idx) => {
              const size = parseFloat(position.position.szi);
              const isLong = size > 0;
              const entryPrice = parseFloat(position.position.entryPx || 0);
              const markPrice = parseFloat(position.position.positionValue || 0) / Math.abs(size);
              const unrealizedPnl = parseFloat(position.position.unrealizedPnl || 0);
              const marginUsed = parseFloat(position.position.marginUsed || 0);
              const roe = marginUsed > 0 ? (unrealizedPnl / marginUsed) * 100 : 0;
              
              return (
                <div key={idx} className="position-card">
                  <div className="position-header-row">
                    <div className="position-pair">
                      <span className="pair-symbol">{position.position.coin}/USD</span>
                      <span className={`position-side ${isLong ? 'long' : 'short'}`}>
                        {isLong ? 'LONG' : 'SHORT'}
                      </span>
                    </div>
                    <button 
                      className="close-position-btn"
                      onClick={() => handleClosePosition(position)}
                      disabled={closingPosition === position.position.coin}
                    >
                      {closingPosition === position.position.coin ? '...' : 'Close'}
                    </button>
                  </div>

                  <div className="position-stats">
                    <div className="stat-row">
                      <span className="stat-label">Size:</span>
                      <span className="stat-value animated-number size-display">{formatSize(Math.abs(size))}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Entry:</span>
                      <span className="stat-value animated-number">${formatPrice(entryPrice)}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Mark:</span>
                      <span className="stat-value animated-number">${formatPrice(markPrice)}</span>
                    </div>
                  </div>

                  <div className="position-pnl-row">
                    <div className="pnl-info">
                      <span className="pnl-label">PnL:</span>
                      <span className={`pnl-value animated-number ${unrealizedPnl >= 0 ? 'positive' : 'negative'}`}>
                        {formatPnl(unrealizedPnl)}
                      </span>
                    </div>
                    <div className="roe-info">
                      <span className="roe-label">ROE:</span>
                      <span className={`roe-value animated-number ${roe >= 0 ? 'positive' : 'negative'}`}>
                        {roe >= 0 ? '+' : ''}{roe.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivePositionsPanel;

