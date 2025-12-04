import React, { useState, useEffect } from 'react';
import { useWallet } from '../../../context/WalletContext';
import hyperliquidTrading from '../../../services/hyperliquidTrading';
import { useTranslation } from 'react-i18next';
import './TradingStatsPanel.css';

const TradingStatsPanel = () => {
  const { t } = useTranslation();
  const { isConnected, address } = useWallet();
  const [stats, setStats] = useState({
    totalPnl: 0,
    totalPnlPercent: 0,
    totalVolume: 0,
    totalTrades: 0,
    accountValue: 0,
    marginUsed: 0,
    availableBalance: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setStats({
        totalPnl: 0,
        totalPnlPercent: 0,
        totalVolume: 0,
        totalTrades: 0,
        accountValue: 0,
        marginUsed: 0,
        availableBalance: 0
      });
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Fetch user state
        const userState = await hyperliquidTrading.getUserState();
        
        if (userState) {
          // Calculate total PnL from positions
          const positions = userState.assetPositions || [];
          const totalPnl = positions.reduce((sum, pos) => {
            return sum + parseFloat(pos.position?.unrealizedPnl || 0);
          }, 0);

          // Get account value and margin
          const accountValue = parseFloat(userState.crossMarginSummary?.accountValue || 0);
          const marginUsed = parseFloat(userState.crossMarginSummary?.totalMarginUsed || 0);
          const withdrawable = parseFloat(userState.withdrawable || 0);
          
          const totalPnlPercent = accountValue > 0 
            ? ((totalPnl / (accountValue - totalPnl)) * 100) 
            : 0;

          // Get open orders count
          const orders = await hyperliquidTrading.getOpenOrders();
          const totalTrades = orders?.length || 0;

          setStats({
            totalPnl,
            totalPnlPercent,
            totalVolume: 0, // Could be calculated from fills if available
            totalTrades,
            accountValue,
            marginUsed,
            availableBalance: withdrawable
          });
        }
      } catch (error) {
        console.error('[TradingStatsPanel] Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    
    return () => clearInterval(interval);
  }, [isConnected, address]);

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0.00';
    return num.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatPercent = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00%';
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  if (!isConnected) {
    return (
      <div className="trading-stats-panel">
        <div className="stats-empty">
          <p>Connect your wallet to view statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-stats-panel">
      <div className="stats-header">
        <h6 className="stats-title">Trading Statistics</h6>
      </div>

      <div className="stats-content">
        {loading ? (
          <div className="stats-loading">
            <div className="spinner"></div>
            <span>Loading...</span>
          </div>
        ) : (
          <div className="stats-grid">
            {/* Total PnL - Featured Card */}
            <div className="stat-card pnl-card featured-card">
              <div className="stat-label">Total PnL</div>
              <div className={`stat-value ${stats.totalPnl >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(stats.totalPnl)}
              </div>
              <div className={`stat-change ${stats.totalPnlPercent >= 0 ? 'positive' : 'negative'}`}>
                {formatPercent(stats.totalPnlPercent)}
              </div>
              <div className="stat-subtitle">Unrealized Profit & Loss</div>
            </div>

            {/* Account Value */}
            <div className="stat-card account-card">
              <div className="stat-label">Account Value</div>
              <div className="stat-value">{formatCurrency(stats.accountValue)}</div>
              <div className="stat-subtitle">Total Equity</div>
            </div>

            {/* Available Balance */}
            <div className="stat-card balance-card">
              <div className="stat-label">Withdrawable</div>
              <div className="stat-value">{formatCurrency(stats.availableBalance)}</div>
              <div className="stat-subtitle">Available for withdrawal</div>
            </div>

            {/* Margin Used */}
            <div className="stat-card margin-card">
              <div className="stat-label">Margin Used</div>
              <div className="stat-value">{formatCurrency(stats.marginUsed)}</div>
              <div className="stat-subtitle">
                {stats.accountValue > 0 
                  ? `${((stats.marginUsed / stats.accountValue) * 100).toFixed(1)}% of Account`
                  : '0% of Account'}
              </div>
            </div>

            {/* Open Orders */}
            <div className="stat-card orders-card">
              <div className="stat-label">Active Orders</div>
              <div className="stat-value">{stats.totalTrades}</div>
              <div className="stat-subtitle">Open orders count</div>
            </div>

            {/* Total Volume */}
            <div className="stat-card volume-card">
              <div className="stat-label">Trading Volume</div>
              <div className="stat-value">{formatCurrency(stats.totalVolume)}</div>
              <div className="stat-subtitle">24h trading volume</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingStatsPanel;

