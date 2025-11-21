import React, { useMemo, useState, useEffect } from 'react';
import { useUserBalance } from '../../../hooks/useUserBalance.js';
import { useWallet } from '../../../context/WalletContext.js';
import { apiService } from '../../../api/apiService.js';
import DataTable from '../../components/shared/DataTable';
import StatCard from '../../components/shared/StatCard';
import ConnectWalletButton from '../../components/Web3/ConnectWalletButton.js';

const PortfolioContent = () => {
  const { userState, loading, error } = useUserBalance(30000);
  const [prices, setPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(true);

  // fetch current prices for all assets
  useEffect(() => {
    const fetchPrices = async () => {
      if (!userState?.assetPositions || userState.assetPositions.length === 0) {
        setLoadingPrices(false);
        return;
      }

      try {
        const symbols = userState.assetPositions
          .map(pos => pos.position?.coin)
          .filter(Boolean);
        
        if (symbols.length === 0) {
          setLoadingPrices(false);
          return;
        }

        const allPrices = await apiService.fetchMultipleCryptoPrices(symbols);
        setPrices(allPrices);
        setLoadingPrices(false);
      } catch (err) {
        console.error('Error fetching prices:', err);
        setLoadingPrices(false);
      }
    };

    fetchPrices();
  }, [userState]);

  // process portfolio data from userState
  const portfolioData = useMemo(() => {
    if (!userState?.assetPositions || !Array.isArray(userState.assetPositions)) {
      return [];
    }

    return userState.assetPositions
      .filter(pos => pos.position && parseFloat(pos.position.szi || '0') !== 0)
      .map(pos => {
        const coin = pos.position.coin;
        const size = parseFloat(pos.position.szi || '0');
        const entryPx = parseFloat(pos.position.entryPx || '0');
        const currentPrice = prices[coin.toLowerCase()]?.price || entryPx || 0;
        const value = size * currentPrice;
        const pnl = entryPx > 0 ? ((currentPrice - entryPx) / entryPx) * 100 : 0;

        return {
          asset: coin,
          size: size,
          entryPrice: entryPx,
          currentPrice: currentPrice,
          value: value,
          pnl: pnl,
          pnlValue: (currentPrice - entryPx) * size
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [userState, prices]);

  const stats = useMemo(() => {
    const totalAssets = portfolioData.length;
    const totalValue = portfolioData.reduce((sum, asset) => sum + asset.value, 0);
    const totalPnL = portfolioData.reduce((sum, asset) => sum + asset.pnlValue, 0);
    const totalPnLPercent = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

    return {
      totalAssets,
      totalValue,
      totalPnL,
      totalPnLPercent
    };
  }, [portfolioData]);

  const columns = [
    { key: 'asset', label: 'Activo' },
    { key: 'size', label: 'Cantidad', render: r => r.size.toFixed(6), className:'text-end' },
    { key: 'entryPrice', label: 'Precio Entrada', render: r => `$${r.entryPrice.toFixed(2)}`, className:'text-end' },
    { key: 'currentPrice', label: 'Precio Actual', render: r => `$${r.currentPrice.toFixed(2)}`, className:'text-end' },
    { key: 'value', label: 'Valor', render: r => `$${r.value.toFixed(2)}`, className:'text-end' },
    { key: 'pnl', label: 'PnL %', render: r => (
      <span className={r.pnl >= 0 ? 'text-success' : 'text-danger'}>
        {r.pnl >= 0 ? '+' : ''}{r.pnl.toFixed(2)}%
      </span>
    ), className:'text-end' },
    { key: 'pnlValue', label: 'PnL USD', render: r => (
      <span className={r.pnlValue >= 0 ? 'text-success' : 'text-danger'}>
        {r.pnlValue >= 0 ? '+' : ''}${r.pnlValue.toFixed(2)}
      </span>
    ), className:'text-end' },
  ];

  if (loading || loadingPrices) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2 text-muted">Cargando portafolio...</p>
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

  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-sm-6 col-lg-3">
          <StatCard title="Activos" value={stats.totalAssets} />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard title="Valor Total" value={`$${stats.totalValue.toFixed(2)}`} />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard 
            title="PnL Total" 
            value={`${stats.totalPnL >= 0 ? '+' : ''}$${stats.totalPnL.toFixed(2)}`}
            subtitle={`${stats.totalPnLPercent >= 0 ? '+' : ''}${stats.totalPnLPercent.toFixed(2)}%`}
          />
        </div>
        <div className="col-sm-6 col-lg-3">
          <StatCard 
            title="Account Value" 
            value={userState?.marginSummary?.accountValue ? `$${parseFloat(userState.marginSummary.accountValue).toFixed(2)}` : '$0.00'} 
          />
        </div>
      </div>
      <DataTable columns={columns} data={portfolioData} emptyMessage="No tienes posiciones abiertas" />
    </>
  );
};

const PortfolioPage = () => {
  const { isConnected } = useWallet();

  return (
    <div className="page-content">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Portafolio / Balances</h4>
        {!isConnected && (
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Conecta tu wallet para ver tu portafolio</span>
            <ConnectWalletButton />
          </div>
        )}
      </div>
      
      {isConnected ? (
        <PortfolioContent />
      ) : (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="fa fa-wallet fa-3x text-muted mb-3"></i>
            <h5 className="mb-3">Conecta tu Wallet</h5>
            <p className="text-muted mb-4">Conecta tu wallet para ver tu portafolio y balances en Hyperliquid</p>
            <ConnectWalletButton />
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
