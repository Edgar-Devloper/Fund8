import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../../../context/WalletContext';
import hyperliquidTrading from '../../../services/hyperliquidTrading';
import { useTranslation } from 'react-i18next';
import './TradingBottomPanel.css';
import './animations.css';

const TradingBottomPanel = () => {
  const { t } = useTranslation();
  const { isConnected, address } = useWallet();
  const [activeTab, setActiveTab] = useState('openOrders'); // 'openOrders' | 'positions' | 'history'
  const [openOrders, setOpenOrders] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [closingPosition, setClosingPosition] = useState(null);
  const prevOrdersRef = useRef([]);
  const prevPositionsRef = useRef([]);

  useEffect(() => {
    if (!isConnected || !address) {
      setOpenOrders([]);
      setPositions([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch open orders
        const orders = await hyperliquidTrading.getOpenOrders();
        const newOrders = orders || [];
        
        // Check for changes to trigger animations
        if (JSON.stringify(prevOrdersRef.current) !== JSON.stringify(newOrders)) {
          prevOrdersRef.current = newOrders;
        }
        setOpenOrders(newOrders);

        // Fetch positions from user state
        const userState = await hyperliquidTrading.getUserState();
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
        console.error('[TradingBottomPanel] Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    
    return () => clearInterval(interval);
  }, [isConnected, address]);

  const handleCancelOrder = async (order) => {
    if (!order || cancellingOrder) return;
    
    setCancellingOrder(order.oid);
    
    try {
      const result = await hyperliquidTrading.cancelOrder({
        coin: order.coin,
        orderId: order.oid
      });

      if (result.success) {
        // Remove the order from the list
        setOpenOrders(prev => prev.filter(o => o.oid !== order.oid));
      } else {
        alert(`Failed to cancel order: ${result.error}`);
      }
    } catch (error) {
      console.error('[TradingBottomPanel] Error canceling order:', error);
      alert('Error canceling order');
    } finally {
      setCancellingOrder(null);
    }
  };

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
      // If LONG -> SELL, if SHORT -> BUY
      const result = await hyperliquidTrading.placeMarketOrder({
        coin: coin,
        isBuy: !isLong, // Opposite direction
        size: size
      });

      if (result.success) {
        alert(`Position closed successfully!`);
        // Refresh positions
        const userState = await hyperliquidTrading.getUserState();
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
      console.error('[TradingBottomPanel] Error closing position:', error);
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
      <div className="trading-bottom-panel">
        <div className="bottom-panel-empty">
          <p>Connect your wallet to view open orders and positions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-bottom-panel">
      {/* Tabs */}
      <div className="bottom-panel-tabs">
        <button
          className={`bottom-tab ${activeTab === 'openOrders' ? 'active' : ''}`}
          onClick={() => setActiveTab('openOrders')}
        >
          Open Orders {openOrders.length > 0 && `(${openOrders.length})`}
        </button>
        <button
          className={`bottom-tab ${activeTab === 'positions' ? 'active' : ''}`}
          onClick={() => setActiveTab('positions')}
        >
          Positions {positions.length > 0 && `(${positions.length})`}
        </button>
        <button
          className={`bottom-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Trade History
        </button>
      </div>

      {/* Content */}
      <div className="bottom-panel-content">
        {loading && (
          <div className="bottom-panel-loading">
            <div className="spinner"></div>
            <span>Loading...</span>
          </div>
        )}

        {/* Open Orders Tab */}
        {activeTab === 'openOrders' && !loading && (
          <div className="bottom-panel-table-container">
            {openOrders.length === 0 ? (
              <div className="bottom-panel-empty">
                <p>No open orders</p>
              </div>
            ) : (
              <table className="bottom-panel-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Pair</th>
                    <th>Side</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Filled</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {openOrders.map((order) => {
                    const isBuy = order.side === 'B';
                    const filledPercent = (parseFloat(order.sz) - parseFloat(order.szLeft || order.sz)) / parseFloat(order.sz) * 100;
                    
                    return (
                      <tr key={order.oid}>
                        <td className="time-cell">
                          {new Date(order.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="pair-cell">{order.coin}/USD</td>
                        <td className={`side-cell ${isBuy ? 'buy' : 'sell'}`}>
                          {isBuy ? 'BUY' : 'SELL'}
                        </td>
                        <td className="price-cell animated-number">${formatPrice(order.limitPx)}</td>
                        <td className="amount-cell animated-number size-display">{formatSize(order.sz)}</td>
                        <td className="filled-cell">{filledPercent.toFixed(0)}%</td>
                        <td className="total-cell">
                          ${(parseFloat(order.limitPx) * parseFloat(order.sz)).toFixed(2)}
                        </td>
                        <td className="action-cell">
                          <button
                            className="cancel-btn"
                            onClick={() => handleCancelOrder(order)}
                            disabled={cancellingOrder === order.oid}
                          >
                            {cancellingOrder === order.oid ? '...' : 'Cancel'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Positions Tab */}
        {activeTab === 'positions' && !loading && (
          <div className="bottom-panel-table-container">
            {positions.length === 0 ? (
              <div className="bottom-panel-empty">
                <p>No open positions</p>
              </div>
            ) : (
              <table className="bottom-panel-table">
                <thead>
                  <tr>
                    <th>Pair</th>
                    <th>Side</th>
                    <th>Size</th>
                    <th>Entry Price</th>
                    <th>Mark Price</th>
                    <th>Liq. Price</th>
                    <th>Margin</th>
                    <th>PnL</th>
                    <th>ROE</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position, idx) => {
                    const size = parseFloat(position.position.szi);
                    const isLong = size > 0;
                    const entryPrice = parseFloat(position.position.entryPx || 0);
                    const markPrice = parseFloat(position.position.positionValue || 0) / Math.abs(size);
                    const unrealizedPnl = parseFloat(position.position.unrealizedPnl || 0);
                    const marginUsed = parseFloat(position.position.marginUsed || 0);
                    const roe = marginUsed > 0 ? (unrealizedPnl / marginUsed) * 100 : 0;
                    
                    return (
                      <tr key={idx}>
                        <td className="pair-cell">{position.position.coin}/USD</td>
                        <td className={`side-cell ${isLong ? 'buy' : 'sell'}`}>
                          {isLong ? 'LONG' : 'SHORT'}
                        </td>
                        <td className="size-cell animated-number size-display">{formatSize(Math.abs(size))}</td>
                        <td className="price-cell animated-number">${formatPrice(entryPrice)}</td>
                        <td className="price-cell animated-number">${formatPrice(markPrice)}</td>
                        <td className="price-cell">
                          ${formatPrice(position.position.liquidationPx || 0)}
                        </td>
                        <td className="margin-cell">${formatPrice(marginUsed)}</td>
                        <td className={`pnl-cell ${unrealizedPnl >= 0 ? 'positive' : 'negative'}`}>
                          {formatPnl(unrealizedPnl)}
                        </td>
                        <td className={`roe-cell ${roe >= 0 ? 'positive' : 'negative'}`}>
                          {roe >= 0 ? '+' : ''}{roe.toFixed(2)}%
                        </td>
                        <td className="action-cell">
                          <button 
                            className="close-btn"
                            onClick={() => handleClosePosition(position)}
                            disabled={closingPosition === position.position.coin}
                          >
                            {closingPosition === position.position.coin ? '...' : 'Close'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Trade History Tab */}
        {activeTab === 'history' && !loading && (
          <div className="bottom-panel-empty history-empty">
            <p>Trade history coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingBottomPanel;

