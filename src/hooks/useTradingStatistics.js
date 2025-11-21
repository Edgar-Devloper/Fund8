import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext.js';
import { apiService } from '../api/apiService.js';
import { useUserBalance } from './useUserBalance.js';

export const useTradingStatistics = (refreshInterval = 60000) => {
  const { address, isConnected } = useWallet();
  const { userState } = useUserBalance(30000);
  const [statistics, setStatistics] = useState({
    income: 0,
    spends: 0,
    fees: 0,
    invest: 0,
    incomePercent: 0,
    spendsPercent: 0,
    feesPercent: 0,
    investPercent: 0,
    loading: true,
    error: null
  });

  const calculateStatistics = useCallback(async () => {
    if (!isConnected || !address) {
      setStatistics(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setStatistics(prev => ({ ...prev, loading: true, error: null }));

      // get user fills (trade history)
      const fills = await apiService.fetchUserFills(address);
      
      // calculate statistics from trades
      let totalIncome = 0; // positive PnL from profitable trades
      let totalSpends = 0; // negative PnL from losing trades
      let totalFees = 0;
      let totalBuyValue = 0;
      let totalSellValue = 0;

      // group trades by coin to calculate PnL
      const tradesByCoin = {};
      fills.forEach(fill => {
        const fee = fill.fee || 0;
        totalFees += fee;

        if (!tradesByCoin[fill.symbol]) {
          tradesByCoin[fill.symbol] = { buys: [], sells: [] };
        }

        const tradeValue = fill.price * fill.amount;
        if (fill.side === 'buy') {
          tradesByCoin[fill.symbol].buys.push({ price: fill.price, amount: fill.amount, value: tradeValue });
          totalBuyValue += tradeValue;
        } else {
          tradesByCoin[fill.symbol].sells.push({ price: fill.price, amount: fill.amount, value: tradeValue });
          totalSellValue += tradeValue;
        }
      });

      // calculate realized PnL per coin
      Object.keys(tradesByCoin).forEach(symbol => {
        const coinTrades = tradesByCoin[symbol];
        let buyAmount = 0;
        let buyCost = 0;
        let sellAmount = 0;
        let sellRevenue = 0;

        // calculate average buy price
        coinTrades.buys.forEach(buy => {
          buyAmount += buy.amount;
          buyCost += buy.value;
        });

        // calculate average sell price
        coinTrades.sells.forEach(sell => {
          sellAmount += sell.amount;
          sellRevenue += sell.value;
        });

        // calculate realized PnL (FIFO-like calculation)
        const matchedAmount = Math.min(buyAmount, sellAmount);
        if (matchedAmount > 0) {
          const avgBuyPrice = buyCost / buyAmount;
          const avgSellPrice = sellRevenue / sellAmount;
          const realizedPnL = (avgSellPrice - avgBuyPrice) * matchedAmount;

          if (realizedPnL > 0) {
            totalIncome += realizedPnL;
          } else {
            totalSpends += Math.abs(realizedPnL);
          }
        }
      });

      // get account value from userState
      const accountValue = parseFloat(userState?.marginSummary?.accountValue || '0');
      
      // calculate unrealized PnL from current positions
      let unrealizedPnL = 0;
      if (userState?.assetPositions && Array.isArray(userState.assetPositions)) {
        userState.assetPositions.forEach(pos => {
          if (pos.position) {
            const unrealized = parseFloat(pos.position.unrealizedPnl || '0');
            unrealizedPnL += unrealized;
          }
        });
      }

      // add unrealized PnL to income/spends
      if (unrealizedPnL > 0) {
        totalIncome += unrealizedPnL;
      } else {
        totalSpends += Math.abs(unrealizedPnL);
      }

      // calculate percentages
      const total = totalIncome + totalSpends + totalFees + accountValue;
      const incomePercent = total > 0 ? (totalIncome / total) * 100 : 0;
      const spendsPercent = total > 0 ? (totalSpends / total) * 100 : 0;
      const feesPercent = total > 0 ? (totalFees / total) * 100 : 0;
      const investPercent = total > 0 ? (accountValue / total) * 100 : 0;

      setStatistics({
        income: totalIncome,
        spends: totalSpends,
        fees: totalFees,
        invest: accountValue,
        incomePercent: incomePercent,
        spendsPercent: spendsPercent,
        feesPercent: feesPercent,
        investPercent: investPercent,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('[useTradingStatistics] Error:', err);
      setStatistics(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Error al calcular estadísticas'
      }));
    }
  }, [address, isConnected, userState]);

  useEffect(() => {
    calculateStatistics();
    if (refreshInterval > 0 && isConnected && address) {
      const interval = setInterval(calculateStatistics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [address, isConnected, calculateStatistics, refreshInterval]);

  return {
    ...statistics,
    refetch: calculateStatistics,
    isConnected
  };
};

export default useTradingStatistics;

