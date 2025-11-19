/**
 * Recent Trading Activities - Versión con datos REALES de Hyperliquid
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Tab, Nav } from 'react-bootstrap';
import { useMultipleRecentTrades } from '../../../../hooks/useMultipleRecentTrades';

// Importar iconos de criptomonedas
import btcIcon from '../../../../images/icons/btc.png';
import ethIcon from '../../../../images/icons/eth.png';
import ltcIcon from '../../../../images/icons/ltc.png';
import solIcon from '../../../../images/icons/sol.png';

const RecentTradingReal = () => {
  // Memoizar el array de coinIds para evitar re-renders innecesarios
  const coinIds = useMemo(() => ['bitcoin', 'ethereum', 'litecoin', 'solana'], []);
  
  // Obtener trades reales de las 4 cryptos principales
  const { trades, loading, error } = useMultipleRecentTrades(
    coinIds,
    60000 // Actualizar cada 60 segundos (1 minuto)
  );

  // Formatear timestamp a hora
  const formatTime = (timestamp) => {
    if (!timestamp || isNaN(timestamp)) {
      return '--:--:--';
    }
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '--:--:--';
      }
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    } catch (e) {
      return '--:--:--';
    }
  };

  // Formatear precio
  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) {
      return '$0.00';
    }
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // Obtener icono basado en símbolo
  const getIcon = (symbol) => {
    const icons = {
      BTC: btcIcon,
      ETH: ethIcon,
      LTC: ltcIcon,
      SOL: solIcon
    };
    return <img src={icons[symbol] || btcIcon} alt={symbol} width="50" height="50" />;
  };

  // Nombre completo del símbolo
  const getFullName = (symbol) => {
    const names = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      LTC: 'Litecoin',
      SOL: 'Solana'
    };
    return names[symbol] || symbol;
  };

  return (
    <div className="col-xl-6 col-xxl-12">
      <Tab.Container defaultActiveKey="Today">
        <div className="card">
          <div className="card-header d-block d-sm-flex flex-wrap border-0">
            <div className="mb-3">
              <h4 className="fs-20 text-black">Recent Trading Activities</h4>
              <p className="mb-0 fs-12">Trades reales de Hyperliquid en tiempo real</p>
            </div>
            <div className="card-action card-tabs mb-3 style-1">
              <Nav as="ul" className="nav nav-tabs" role="tablist">
                <Nav.Item as="li">
                  <Nav.Link eventKey="Today">Real-time</Nav.Link>
                </Nav.Item>
              </Nav>
            </div>
          </div>
          <div className="card-body py-0 px-3">
            <div className="tab-content">
              <Tab.Content>
                <Tab.Pane eventKey="Today">
                  <div className="table-responsive">
                    {loading && trades.length === 0 ? (
                      <div className="text-center py-4">
                        <span>Cargando trades...</span>
                      </div>
                    ) : error && trades.length === 0 ? (
                      <div className="text-center py-4 text-danger">
                        <span>Error: {error}</span>
                      </div>
                    ) : trades.length === 0 ? (
                      <div className="text-center py-4">
                        <span>No hay trades disponibles</span>
                      </div>
                    ) : (
                      <table className="table border-hover tr-rounded card-table cardtbl-link">
                        <tbody>
                          {trades.slice(0, 6).map((trade, index) => {
                            // Validar y obtener valores con fallbacks
                            const size = trade?.size || trade?.quantity || 0;
                            const price = trade?.price || 0;
                            const timestamp = trade?.timestamp || Date.now();
                            const symbol = trade?.symbol || 'BTC';
                            const side = trade?.side || 'buy';
                            
                            return (
                              <tr key={`${trade?.id || index}-${index}`}>
                                <td>
                                  {getIcon(symbol)}
                                </td>
                                <td className="wspace-no">
                                  <h6 className="fs-16 font-w600 mb-0">
                                    <Link to="#" className="text-black">
                                      {getFullName(symbol)}
                                    </Link>
                                  </h6>
                                </td>
                                <td>
                                  <span className="text-black">{formatTime(timestamp)}</span>
                                </td>
                                <td>
                                  <span className="font-w600 text-black">
                                    {formatPrice(price)}
                                  </span>
                                </td>
                                <td>
                                  <Link to="#" className={`btn-link ${side === 'buy' ? 'text-success' : 'text-danger'}`}>
                                    {side === 'buy' ? 'BUY' : 'SELL'} {size !== undefined && size !== null && !isNaN(size) ? parseFloat(size).toFixed(4) : '0.0000'}
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </div>
          </div>
        </div>
      </Tab.Container>
    </div>
  );
};

export default RecentTradingReal;

