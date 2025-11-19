import React from 'react';
import { useUserFills } from '../../../hooks/useUserFills.js';
import { useWallet } from '../../../context/WalletContext.js';
import DataTable from '../../components/shared/DataTable';
import ConnectWalletButton from '../../components/Web3/ConnectWalletButton.js';

const HistoryTable = () => {
  const { fills, loading, error } = useUserFills(60000, 200);
  
  const columns = [
    { key: 'tradeId', label: 'Trade ID', render: r => <span className="text-muted small">{r.tradeId ? r.tradeId.toString().slice(0, 8) + '...' : r.id.slice(0, 8)}</span> },
    { key: 'symbol', label: 'Par' },
    { key: 'side', label: 'Side', render: r => <span className={r.side==='buy'?'text-success fw-bold':'text-danger fw-bold'}>{r.side.toUpperCase()}</span> },
    { key: 'price', label: 'Precio', render: r => `$${r.price.toFixed(2)}`, className:'text-end' },
    { key: 'amount', label: 'Cantidad', render: r => r.amount.toFixed(4), className:'text-end' },
    { key: 'fee', label: 'Fee', render: r => `$${r.fee.toFixed(4)}`, className:'text-end text-muted' },
    { key: 'timestamp', label: 'Fecha/Hora', render: r => new Date(r.timestamp).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }), className:'text-end' },
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2 text-muted">Cargando historial de trades...</p>
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

  return <DataTable columns={columns} data={fills} emptyMessage="No tienes historial de trades" />;
};

const OrderHistoryPage = () => {
  const { isConnected } = useWallet();

  return (
    <div className="page-content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Historial de Ejecuciones</h4>
        {!isConnected && (
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Conecta tu wallet para ver tu historial</span>
            <ConnectWalletButton />
          </div>
        )}
      </div>
      
      {isConnected ? (
        <HistoryTable />
      ) : (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="fa fa-history fa-3x text-muted mb-3"></i>
            <h5 className="mb-3">Conecta tu Wallet</h5>
            <p className="text-muted mb-4">Conecta tu wallet para ver tu historial de trades en Hyperliquid</p>
            <ConnectWalletButton />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
