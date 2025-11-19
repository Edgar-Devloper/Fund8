import React, { useState } from 'react';
import { useOpenOrders } from '../../../hooks/useOpenOrders.js';
import { useWallet } from '../../../context/WalletContext.js';
import { useNotifications } from '../../../context/NotificationContext.js';
import { apiService } from '../../../api/apiService.js';
import DataTable from '../../components/shared/DataTable';
import ConnectWalletButton from '../../components/Web3/ConnectWalletButton.js';

const OpenOrdersTable = () => {
  const { openOrders, loading, error, refetch } = useOpenOrders(30000);
  const { signer } = useWallet();
  const { addNotification } = useNotifications();
  const [cancelling, setCancelling] = useState({});
  
  const handleCancel = async (orderId) => {
    if (!signer) {
      addNotification({
        type: 'warning',
        title: 'Wallet no conectada',
        message: 'Por favor, conecta tu wallet para cancelar órdenes'
      });
      return;
    }
    
    setCancelling(prev => ({ ...prev, [orderId]: true }));
    
    try {
      await apiService.cancelOrder(signer, orderId);
      addNotification({
        type: 'success',
        title: 'Orden Cancelada',
        message: 'La orden ha sido cancelada exitosamente'
      });
      // refresh orders
      setTimeout(() => refetch(), 1000);
    } catch (err) {
      console.error('Error canceling order:', err);
      addNotification({
        type: 'error',
        title: 'Error al Cancelar',
        message: err.message || 'Error al cancelar la orden'
      });
    } finally {
      setCancelling(prev => ({ ...prev, [orderId]: false }));
    }
  };
  
  const columns = [
    { key: 'orderId', label: 'Order ID', render: r => <span className="text-muted small">{r.orderId ? r.orderId.slice(0, 8) + '...' : r.id.slice(0, 8)}</span> },
    { key: 'symbol', label: 'Par' },
    { key: 'side', label: 'Side', render: r => <span className={r.side==='buy'?'text-success fw-bold':'text-danger fw-bold'}>{r.side.toUpperCase()}</span> },
    { key: 'type', label: 'Tipo' },
    { key: 'price', label: 'Precio', render: r => `$${r.price.toFixed(2)}`, className:'text-end' },
    { key: 'amount', label: 'Cantidad', render: r => r.amount.toFixed(4), className:'text-end' },
    { key: 'filledPercent', label: 'Filled %', render: r => `${r.filledPercent}%`, className:'text-end' },
    { key: 'timestamp', label: 'Fecha', render: r => new Date(r.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }), className:'text-end' },
    { 
      key: 'actions', 
      label: 'Acciones', 
      render: r => (
        <button
          className="btn btn-sm btn-danger"
          onClick={() => handleCancel(r.orderId || r.id)}
          disabled={cancelling[r.orderId || r.id]}
        >
          {cancelling[r.orderId || r.id] ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" role="status"></span>
              Cancelando...
            </>
          ) : (
            'Cancelar'
          )}
        </button>
      ),
      className: 'text-center'
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2 text-muted">Cargando órdenes abiertas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning" role="alert">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return <DataTable columns={columns} data={openOrders} emptyMessage="No tienes órdenes abiertas" />;
};

const OrdersPage = () => {
  const { isConnected } = useWallet();

  return (
    <div className="page-content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Órdenes Activas</h4>
        {!isConnected && (
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Conecta tu wallet para ver tus órdenes</span>
            <ConnectWalletButton />
          </div>
        )}
      </div>
      
      {isConnected ? (
        <OpenOrdersTable />
      ) : (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="fa fa-wallet fa-3x text-muted mb-3"></i>
            <h5 className="mb-3">Conecta tu Wallet</h5>
            <p className="text-muted mb-4">Conecta tu wallet para ver tus órdenes abiertas en Hyperliquid</p>
            <ConnectWalletButton />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
