import React from 'react';
import { useTradingData } from './context/HyperliquidTradingProvider';

/**
 * WebSocketStatus Component
 * Displays the real-time connection status and data source indicators
 * 
 * Usage:
 * <WebSocketStatus position="top-right" />
 */
const WebSocketStatus = ({ position = 'top-right', compact = false }) => {
  const { realTime, websocket } = useTradingData();

  const positions = {
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
  };

  const containerStyle = {
    position: 'fixed',
    ...positions[position],
    zIndex: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: compact ? '8px 12px' : '12px 16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontSize: compact ? '11px' : '12px',
    fontFamily: 'monospace',
    minWidth: compact ? 'auto' : '200px',
  };

  const statusIndicatorStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: compact ? '0' : '8px',
  };

  const dotStyle = (connected) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: connected ? '#10b981' : '#ef4444',
    animation: connected ? 'pulse 2s infinite' : 'none',
  });

  const labelStyle = {
    fontWeight: 'bold',
    color: '#374151',
  };

  const dataSourceStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    color: '#6b7280',
    marginTop: '4px',
  };

  if (compact) {
    return (
      <div style={containerStyle}>
        <div style={statusIndicatorStyle}>
          <div style={dotStyle(websocket?.isConnected)} />
          <span style={labelStyle}>
            {websocket?.isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
      
      {/* WebSocket Status */}
      <div style={statusIndicatorStyle}>
        <div style={dotStyle(websocket?.isConnected)} />
        <span style={labelStyle}>
          {websocket?.isConnected ? 'WebSocket Conectado' : 'WebSocket Desconectado'}
        </span>
      </div>

      {/* Data Sources */}
      {websocket?.isConnected && (
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
          <div style={dataSourceStyle}>
            <span style={{ color: realTime?.price ? '#10b981' : '#6b7280' }}>
              {realTime?.price ? '⚡' : '🔄'}
            </span>
            <span>Prices: {realTime?.price ? 'Real-time' : 'Polling'}</span>
          </div>
          
          <div style={dataSourceStyle}>
            <span style={{ color: realTime?.orderBook ? '#10b981' : '#6b7280' }}>
              {realTime?.orderBook ? '⚡' : '🔄'}
            </span>
            <span>Order Book: {realTime?.orderBook ? 'Real-time' : 'Polling'}</span>
          </div>
          
          <div style={dataSourceStyle}>
            <span style={{ color: realTime?.trades ? '#10b981' : '#6b7280' }}>
              {realTime?.trades ? '⚡' : '🔄'}
            </span>
            <span>Trades: {realTime?.trades ? 'Real-time' : 'Polling'}</span>
          </div>
        </div>
      )}

      {/* Offline Message */}
      {!websocket?.isConnected && (
        <div style={{ 
          marginTop: '8px', 
          padding: '6px', 
          backgroundColor: '#fef2f2', 
          borderRadius: '4px',
          fontSize: '10px',
          color: '#991b1b'
        }}>
          Usando REST API (polling)
        </div>
      )}
    </div>
  );
};

export default WebSocketStatus;

