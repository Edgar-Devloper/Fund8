import React from 'react';
import { MockTradingDataProvider, useTradingData } from '../../components/trading/context/MockTradingDataProvider';
import DataTable from '../../components/shared/DataTable';

const HistoryTable = () => {
  const { trades } = useTradingData();
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'symbol', label: 'Par' },
    { key: 'side', label: 'Side', render: r => <span className={r.side==='buy'?'text-success':'text-danger'}>{r.side}</span> },
    { key: 'price', label: 'Precio', render: r => r.price.toFixed(2), className:'text-end' },
    { key: 'amount', label: 'Cantidad', render: r => r.amount, className:'text-end' },
    { key: 'ts', label: 'Hora', render: r => new Date(r.ts).toLocaleTimeString(), className:'text-end' },
  ];
  return <DataTable columns={columns} data={trades.slice(0,120)} emptyMessage="Sin historial" />;
};

const OrderHistoryPage = () => {
  return (
    <MockTradingDataProvider>
      <div className="page-content">
        
          <h4 className="mb-3">Historial de Ejecuciones</h4>
          <HistoryTable />
        
      </div>
    </MockTradingDataProvider>
  );
};

export default OrderHistoryPage;
