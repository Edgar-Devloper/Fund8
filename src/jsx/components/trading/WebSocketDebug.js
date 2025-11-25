import React, { useEffect, useState } from 'react';
import { useTradingData } from './context/HyperliquidTradingProvider';

/**
 * WebSocketDebug Component
 * Shows detailed WebSocket connection status and message statistics
 * For development/debugging purposes
 */
const WebSocketDebug = () => {
  const { websocket, realTime } = useTradingData();
  const [messages, setMessages] = useState({
    allMids: 0,
    trades: 0,
    orderBook: 0,
    total: 0
  });

  useEffect(() => {
    // This is a simplified debug - in production you'd hook into the actual message stream
    const interval = setInterval(() => {
      setMessages(prev => ({
        ...prev,
        total: prev.total + 1
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '11px',
      minWidth: '250px',
      maxWidth: '350px',
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}>
        🔍 WebSocket Debug
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <div>Status:</div>
        <div style={{ color: websocket?.isConnected ? '#10b981' : '#ef4444' }}>
          {websocket?.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        
        <div>Prices:</div>
        <div style={{ color: realTime?.price ? '#10b981' : '#9ca3af' }}>
          {realTime?.price ? '⚡ Real-time' : '🔄 REST'}
        </div>
        
        <div>Order Book:</div>
        <div style={{ color: realTime?.orderBook ? '#10b981' : '#9ca3af' }}>
          {realTime?.orderBook ? '⚡ Real-time' : '🔄 REST'}
        </div>
        
        <div>Trades:</div>
        <div style={{ color: realTime?.trades ? '#10b981' : '#9ca3af' }}>
          {realTime?.trades ? '⚡ Real-time' : '🔄 REST'}
        </div>
      </div>

      <div style={{ 
        marginTop: '8px', 
        paddingTop: '8px', 
        borderTop: '1px solid rgba(255,255,255,0.2)',
        fontSize: '10px',
        color: '#9ca3af'
      }}>
        Press F12 → Console for detailed logs
      </div>
    </div>
  );
};

export default WebSocketDebug;

