import React, { useMemo } from 'react';
import { MockTradingDataProvider, useTradingData } from '../../components/trading/context/MockTradingDataProvider';
import DataTable from '../../components/shared/DataTable';
import StatCard from '../../components/shared/StatCard';

const PortfolioContent = () => {
  const { portfolio, tickers } = useTradingData();
  // Supongamos valuación usando precio del primer ticker coin si coincide con asset/BTC/ETH
  const totalAssets = portfolio.length;
  const totalFree = portfolio.reduce((a,b)=>a + b.free,0);
  const columns = [
    { key: 'asset', label: 'Activo' },
    { key: 'free', label: 'Disponible', render: r => r.free.toFixed(6), className:'text-end' },
    { key: 'locked', label: 'Bloqueado', render: r => r.locked.toFixed(6), className:'text-end' },
  ];
  const totalValueFake = useMemo(()=> (totalFree).toFixed(4), [totalFree]);
  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-sm-6 col-lg-3"><StatCard title="Activos" value={totalAssets} /></div>
        <div className="col-sm-6 col-lg-3"><StatCard title="Free Total" value={totalFree.toFixed(4)} /></div>
        <div className="col-sm-6 col-lg-3"><StatCard title="Valor Aproximado" value={totalValueFake} subtitle="(mock)" /></div>
        <div className="col-sm-6 col-lg-3"><StatCard title="Pairs Seguimiento" value={tickers.length} /></div>
      </div>
      <DataTable columns={columns} data={portfolio} />
    </>
  );
};

const PortfolioPage = () => {
  return (
    <MockTradingDataProvider>
      <div className="page-content">
        
          <h4 className="mb-3">Portafolio / Balances</h4>
          <PortfolioContent />
        
      </div>
    </MockTradingDataProvider>
  );
};

export default PortfolioPage;
