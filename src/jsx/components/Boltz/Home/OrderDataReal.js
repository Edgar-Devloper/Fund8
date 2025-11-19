/**
 * Order Data - Versión con Order Book REAL de Hyperliquid
 */

import React from 'react';
import { useOrderBook } from '../../../../hooks/useOrderBook';

const OrderDataReal = ({ type = 'sell', coinId = 'bitcoin' }) => {
  const { orderBook, loading, error } = useOrderBook(coinId, 30000); // Actualizar cada 30 segundos

  // Determinar si mostrar asks (sell) o bids (buy)
  const orders = (type === 'sell' ? orderBook?.asks : orderBook?.bids) || [];

  // Formatear precio
  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) {
      return '0.00';
    }
    return parseFloat(price).toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  // Formatear cantidad
  const formatAmount = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0.0000';
    }
    return parseFloat(amount).toFixed(4);
  };

  // Calcular total
  const calculateTotal = (price, amount) => {
    if (price === undefined || price === null || amount === undefined || amount === null || isNaN(price) || isNaN(amount)) {
      return '0.00';
    }
    return (parseFloat(price) * parseFloat(amount)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <>
      <table className="table text-center bg-primary-hover tr-rounded order-tbl">
        <thead>
          <tr>
            <th className="text-left">Price</th>
            <th className="text-center">Amount</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {loading && orders.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center py-3">
                <span>Cargando...</span>
              </td>
            </tr>
          ) : error && orders.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center py-3 text-danger">
                <span>Error: {error}</span>
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center py-3">
                <span>No hay órdenes</span>
              </td>
            </tr>
          ) : (
            orders.slice(0, 8).map((order, index) => {
              // Usar quantity en lugar de size, y agregar validación
              const quantity = order?.quantity || order?.size || 0;
              const price = order?.price || 0;
              
              return (
                <tr key={index}>
                  <td className="text-left">{formatPrice(price)}</td>
                  <td>{formatAmount(quantity)}</td>
                  <td className="text-right">${calculateTotal(price, quantity)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </>
  );
};

export default OrderDataReal;

