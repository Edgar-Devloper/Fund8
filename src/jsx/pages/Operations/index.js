import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../../../context/WalletContext';
import { useUserPositions } from '../../../hooks/useUserPositions';
import { useUserFills } from '../../../hooks/useUserFills';
import HyperliquidNav from '../../components/trading/HyperliquidNav';
import ConnectWalletButton from '../../components/Web3/ConnectWalletButton';
import './Operations.css';

/**
 * OperationsPage - Página de operaciones de trading
 * Muestra:
 * - Posiciones abiertas (Open/Close, Long/Short)
 * - Historial de trades (fills)
 * - Resultados (+/-)
 */
const OperationsPage = () => {
  const { t } = useTranslation();
  const { isConnected, address } = useWallet();
  const { positions, loading: positionsLoading, error: positionsError } = useUserPositions(15000);
  const { fills, loading: fillsLoading, error: fillsError } = useUserFills(60000, 200);
  const [activeTab, setActiveTab] = useState('positions'); // 'positions' | 'history'

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Formatear porcentaje
  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Formatear fecha/hora
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '--';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  // Calcular resultado del trade (PnL estimado)
  const calculateTradeResult = (fill) => {
    // Para simplificar, usamos el fee como indicador
    // En producción, esto debería calcularse con el precio de entrada vs precio de salida
    return fill.fee || 0;
  };

  return (
    <div className="operations-page" style={{
      minHeight: '100vh',
      background: '#0a0e27',
      paddingTop: '80px'
    }}>
      <HyperliquidNav />
      
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        <div style={{
          background: '#151a2e',
          borderRadius: '12px',
          border: '1px solid #1e2541',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #1e2541',
            background: '#151a2e'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h1 style={{
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: '600',
                margin: 0
              }}>
                {t('operations.title', 'Trading Operations')}
              </h1>
              {!isConnected && (
                <ConnectWalletButton />
              )}
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid #1e2541'
            }}>
              <button
                onClick={() => setActiveTab('positions')}
                style={{
                  padding: '10px 20px',
                  background: activeTab === 'positions' ? '#00c087' : 'transparent',
                  border: 'none',
                  color: activeTab === 'positions' ? '#ffffff' : '#a0aec0',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderRadius: '8px 8px 0 0',
                  transition: 'all 0.2s ease'
                }}
              >
                {t('operations.open_positions', 'Open Positions')}
                {positions.length > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    background: activeTab === 'positions' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(160, 174, 192, 0.2)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {positions.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                style={{
                  padding: '10px 20px',
                  background: activeTab === 'history' ? '#00c087' : 'transparent',
                  border: 'none',
                  color: activeTab === 'history' ? '#ffffff' : '#a0aec0',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderRadius: '8px 8px 0 0',
                  transition: 'all 0.2s ease'
                }}
              >
                {t('operations.trade_history', 'Trade History')}
                {fills.length > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    background: activeTab === 'history' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(160, 174, 192, 0.2)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {fills.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {!isConnected ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#a0aec0'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                  opacity: 0.5
                }}>
                  🔒
                </div>
                <h3 style={{
                  color: '#ffffff',
                  marginBottom: '12px'
                }}>
                  {t('operations.connect_wallet', 'Connect Your Wallet')}
                </h3>
                <p style={{
                  marginBottom: '24px',
                  fontSize: '14px'
                }}>
                  {t('operations.connect_wallet_message', 'Connect your wallet to view your trading operations')}
                </p>
                <ConnectWalletButton />
              </div>
            ) : activeTab === 'positions' ? (
              /* Open Positions Tab */
              <div>
                {positionsLoading ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#a0aec0'
                  }}>
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p style={{ marginTop: '16px', fontSize: '14px' }}>
                      {t('operations.loading_positions', 'Loading positions...')}
                    </p>
                  </div>
                ) : positionsError ? (
                  <div style={{
                    padding: '20px',
                    background: 'rgba(255, 92, 92, 0.1)',
                    border: '1px solid #ff5c5c',
                    borderRadius: '8px',
                    color: '#ff5c5c'
                  }}>
                    <strong>Error:</strong> {positionsError}
                  </div>
                ) : positions.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#a0aec0'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
                      📊
                    </div>
                    <p>{t('operations.no_positions', 'No open positions')}</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      color: '#ffffff'
                    }}>
                      <thead>
                        <tr style={{
                          borderBottom: '1px solid #1e2541',
                          background: '#0a0e27'
                        }}>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Symbol</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Side</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Size</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Entry Price</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Mark Price</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Unrealized PnL</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>ROE</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Leverage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((position, index) => (
                          <tr
                            key={index}
                            style={{
                              borderBottom: '1px solid #1e2541',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#1a1f3a';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <td style={{ padding: '12px', fontWeight: '600' }}>
                              {position.coin}/USD
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                background: position.side === 'LONG' 
                                  ? 'rgba(0, 192, 135, 0.1)' 
                                  : 'rgba(255, 92, 92, 0.1)',
                                color: position.side === 'LONG' ? '#00c087' : '#ff5c5c',
                                border: `1px solid ${position.side === 'LONG' 
                                  ? 'rgba(0, 192, 135, 0.2)' 
                                  : 'rgba(255, 92, 92, 0.2)'}`
                              }}>
                                {position.side}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              {position.size.toFixed(4)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              {formatCurrency(position.entryPrice)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              {formatCurrency(position.markPrice)}
                            </td>
                            <td style={{
                              padding: '12px',
                              textAlign: 'right',
                              fontWeight: '600',
                              color: position.unrealizedPnl >= 0 ? '#00c087' : '#ff5c5c'
                            }}>
                              {formatCurrency(position.unrealizedPnl)}
                            </td>
                            <td style={{
                              padding: '12px',
                              textAlign: 'right',
                              color: position.returnOnEquity >= 0 ? '#00c087' : '#ff5c5c'
                            }}>
                              {formatPercent(position.returnOnEquity)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                background: 'rgba(255, 193, 7, 0.1)',
                                color: '#ffc107',
                                border: '1px solid rgba(255, 193, 7, 0.2)'
                              }}>
                                {position.leverage.toFixed(1)}x
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* Trade History Tab */
              <div>
                {fillsLoading ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#a0aec0'
                  }}>
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p style={{ marginTop: '16px', fontSize: '14px' }}>
                      {t('operations.loading_history', 'Loading trade history...')}
                    </p>
                  </div>
                ) : fillsError ? (
                  <div style={{
                    padding: '20px',
                    background: 'rgba(255, 92, 92, 0.1)',
                    border: '1px solid #ff5c5c',
                    borderRadius: '8px',
                    color: '#ff5c5c'
                  }}>
                    <strong>Error:</strong> {fillsError}
                  </div>
                ) : fills.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#a0aec0'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
                      📝
                    </div>
                    <p>{t('operations.no_trades', 'No trade history')}</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      color: '#ffffff'
                    }}>
                      <thead>
                        <tr style={{
                          borderBottom: '1px solid #1e2541',
                          background: '#0a0e27'
                        }}>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Date/Time</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Symbol</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Type</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Side</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Price</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Amount</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Fee</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#a0aec0',
                            textTransform: 'uppercase'
                          }}>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fills.map((fill, index) => {
                          const result = calculateTradeResult(fill);
                          const isPositive = result >= 0;
                          return (
                            <tr
                              key={index}
                              style={{
                                borderBottom: '1px solid #1e2541',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#1a1f3a';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <td style={{ padding: '12px', fontSize: '13px', color: '#a0aec0' }}>
                                {formatDateTime(fill.timestamp)}
                              </td>
                              <td style={{ padding: '12px', fontWeight: '600' }}>
                                {fill.symbol || 'N/A'}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  background: 'rgba(0, 192, 135, 0.1)',
                                  color: '#00c087',
                                  border: '1px solid rgba(0, 192, 135, 0.2)'
                                }}>
                                  {fill.side === 'buy' ? 'OPEN' : 'CLOSE'}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  background: fill.side === 'buy'
                                    ? 'rgba(0, 192, 135, 0.1)'
                                    : 'rgba(255, 92, 92, 0.1)',
                                  color: fill.side === 'buy' ? '#00c087' : '#ff5c5c',
                                  border: `1px solid ${fill.side === 'buy'
                                    ? 'rgba(0, 192, 135, 0.2)'
                                    : 'rgba(255, 92, 92, 0.2)'}`
                                }}>
                                  {fill.side === 'buy' ? 'LONG' : 'SHORT'}
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                {formatCurrency(fill.price)}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                {fill.amount ? fill.amount.toFixed(4) : '--'}
                              </td>
                              <td style={{
                                padding: '12px',
                                textAlign: 'right',
                                color: '#a0aec0',
                                fontSize: '13px'
                              }}>
                                {formatCurrency(fill.fee || 0)}
                              </td>
                              <td style={{
                                padding: '12px',
                                textAlign: 'right',
                                fontWeight: '600',
                                color: isPositive ? '#00c087' : '#ff5c5c'
                              }}>
                                {isPositive ? '+' : ''}{formatCurrency(Math.abs(result))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsPage;


