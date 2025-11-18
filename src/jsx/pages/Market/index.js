import React from 'react';
import { MockTradingDataProvider, useTradingData } from '../../components/trading/context/MockTradingDataProvider';
import DataTable from '../../components/shared/DataTable';
import StatCard from '../../components/shared/StatCard';

const MarketContent = () => {
  const { tickers } = useTradingData();
  const columns = [
    { key: 'symbol', label: 'Par' },
    { key: 'last', label: 'Último', render: r => r.last.toLocaleString() },
    { key: 'change24h', label: 'Cambio %', render: r => <span className={r.change24h>0?'text-success':r.change24h<0?'text-danger':'text-muted'}>{r.change24h>0?'+':''}{r.change24h.toFixed(2)}%</span> },
    { key: 'volume24h', label: 'Vol 24h', render: r => r.volume24h.toLocaleString() }
  ];
  const topGainer = [...tickers].sort((a,b)=>b.change24h-a.change24h)[0];
  const topLoser = [...tickers].sort((a,b)=>a.change24h-b.change24h)[0];
  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-sm-6 col-lg-3"><StatCard title="Top Gainer" value={topGainer.symbol} delta={topGainer.change24h.toFixed(2)} deltaDirection={topGainer.change24h>=0?'up':'down'} /></div>
        <div className="col-sm-6 col-lg-3"><StatCard title="Top Loser" value={topLoser.symbol} delta={topLoser.change24h.toFixed(2)} deltaDirection={topLoser.change24h>=0?'up':'down'} color="danger" /></div>
        <div className="col-sm-6 col-lg-3"><StatCard title="Pairs" value={tickers.length} subtitle="Activos" /></div>
      </div>
      <DataTable columns={columns} data={tickers} />
    </>
  );
};

const MarketPage = () => {
  return (
    <MockTradingDataProvider>
      <div className="page-content">
        
          <h4 className="mb-3">Market Watch</h4>
          <MarketContent />
        
      </div>
    </MockTradingDataProvider>
  );
};

export default MarketPage;
