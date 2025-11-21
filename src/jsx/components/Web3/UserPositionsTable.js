/**
 * UserPositionsTable - Muestra las posiciones abiertas del usuario
 */

import React from 'react';
import { useWallet } from '../../../context/WalletContext.js';
import { useUserPositions } from '../../../hooks/useUserPositions.js';

const UserPositionsTable = () => {
  const { address } = useWallet();
  const { positions, loading, error, hasOpenPositions } = useUserPositions();

  if (!address) {
    return null;
  }

  if (loading) {
    return (
      <div className="col-xl-12">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Mis Posiciones Abiertas</h4>
          </div>
          <div className="card-body text-center py-4">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Cargando posiciones...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-xl-12">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Mis Posiciones Abiertas</h4>
          </div>
          <div className="card-body text-center py-4">
            <p className="text-danger">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasOpenPositions) {
    return (
      <div className="col-xl-12">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Mis Posiciones Abiertas</h4>
          </div>
          <div className="card-body text-center py-4">
            <i className="fa fa-inbox fa-3x text-muted mb-3"></i>
            <h5 className="text-muted">No tienes posiciones abiertas</h5>
            <p className="text-muted">Abre una posición en Hyperliquid para verla aquí</p>
          </div>
        </div>
      </div>
    );
  }

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
    const color = value >= 0 ? 'text-success' : 'text-danger';
    const sign = value >= 0 ? '+' : '';
    return <span className={color}>{sign}{value.toFixed(2)}%</span>;
  };

  return (
    <div className="col-xl-12">
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Mis Posiciones Abiertas</h4>
          <span className="badge badge-primary badge-lg">{positions.length} posición(es)</span>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Símbolo</th>
                  <th>Lado</th>
                  <th className="text-end">Tamaño</th>
                  <th className="text-end">Precio Entrada</th>
                  <th className="text-end">Precio Mark</th>
                  <th className="text-end">PnL No Realizado</th>
                  <th className="text-end">ROE</th>
                  <th className="text-end">Apalancamiento</th>
                  <th className="text-end">Liquidación</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((position, index) => (
                  <tr key={index}>
                    <td>
                      <strong>{position.coin}/USD</strong>
                    </td>
                    <td>
                      <span className={`badge ${position.side === 'LONG' ? 'badge-success' : 'badge-danger'}`}>
                        {position.side}
                      </span>
                    </td>
                    <td className="text-end">{position.size.toFixed(4)}</td>
                    <td className="text-end">{formatCurrency(position.entryPrice)}</td>
                    <td className="text-end">{formatCurrency(position.markPrice)}</td>
                    <td className="text-end">
                      <strong className={position.unrealizedPnl >= 0 ? 'text-success' : 'text-danger'}>
                        {formatCurrency(position.unrealizedPnl)}
                      </strong>
                    </td>
                    <td className="text-end">{formatPercent(position.returnOnEquity)}</td>
                    <td className="text-end">
                      <span className="badge badge-warning">{position.leverage.toFixed(1)}x</span>
                    </td>
                    <td className="text-end text-muted">{formatCurrency(position.liquidationPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPositionsTable;

