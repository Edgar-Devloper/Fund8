import React from 'react';
import { MockTradingDataProvider, useTradingData } from '../../components/trading/context/MockTradingDataProvider';
import DataTable from '../../components/shared/DataTable';

const OpenOrdersTable = () => {
  const { openOrders } = useTradingData();
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'symbol', label: 'Par' },
    { key: 'side', label: 'Side', render: r => <span className={r.side==='buy'?'text-success':'text-danger'}>{r.side}</span> },
    { key: 'type', label: 'Tipo' },
    { key: 'price', label: 'Precio', render: r => r.price.toFixed(2), className:'text-end' },
    { key: 'amount', label: 'Cantidad', render: r => r.amount, className:'text-end' },
    { key: 'filled', label: 'Filled %', render: r => r.filled.toFixed(2)+'%', className:'text-end' },
  ];
  return <DataTable columns={columns} data={openOrders} emptyMessage="Sin órdenes" />;
};

const OrdersPage = () => {
  return (
    <MockTradingDataProvider>
      <div className="page-content">
        
          <h4 className="mb-3">Órdenes Activas</h4>
          <OpenOrdersTable />
        
      </div>
    </MockTradingDataProvider>
  );
};

export default OrdersPage;
