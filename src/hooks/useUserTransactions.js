import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext.js';
import { apiService } from '../api/apiService.js';

export const useUserTransactions = (refreshInterval = 60000, limit = 200) => {
  const { address, isConnected } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!isConnected || !address) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      // fetch user fills (trades) and non-funding ledger updates (deposits/withdrawals)
      const [fills, ledgerUpdates] = await Promise.all([
        apiService.fetchUserFills(address).catch(() => []),
        apiService.fetchUserNonFundingLedgerUpdates(address).catch(() => [])
      ]);
      
      // combine and format transactions
      const allTransactions = [];
      
      // add fills as trades
      fills.forEach(fill => {
        allTransactions.push({
          id: fill.tradeId || fill.id || `fill-${fill.timestamp}`,
          type: 'trade',
          date: fill.timestamp,
          from: address.slice(0, 6) + '...' + address.slice(-4),
          to: 'Hyperliquid Exchange',
          coin: fill.symbol,
          amount: fill.amount,
          price: fill.price,
          side: fill.side,
          fee: fill.fee,
          total: (fill.price * fill.amount) + fill.fee,
          status: 'COMPLETED',
          note: `${fill.side.toUpperCase()} ${fill.amount} ${fill.symbol} @ $${fill.price}`
        });
      });
      
      // add ledger updates as deposits/withdrawals
      ledgerUpdates.forEach(update => {
        allTransactions.push({
          id: update.id || `ledger-${update.timestamp}`,
          type: update.type, // 'deposit' or 'withdrawal'
          date: update.timestamp,
          from: update.type === 'withdrawal' ? address.slice(0, 6) + '...' + address.slice(-4) : 'External',
          to: update.type === 'deposit' ? address.slice(0, 6) + '...' + address.slice(-4) : 'External',
          coin: update.coin || 'USDC',
          amount: update.amount,
          price: 0,
          side: update.type === 'deposit' ? 'buy' : 'sell',
          fee: update.fee || 0,
          total: update.amount,
          status: 'COMPLETED',
          note: update.note || `${update.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${update.amount} ${update.coin || 'USDC'}`
        });
      });
      
      // sort by date descending
      allTransactions.sort((a, b) => b.date - a.date);
      
      setTransactions(allTransactions.slice(0, limit));
    } catch (err) {
      setError(err.message || 'Error al obtener transacciones');
      console.error('[useUserTransactions] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, limit]);

  useEffect(() => {
    fetchTransactions();
    if (refreshInterval > 0 && isConnected && address) {
      const interval = setInterval(fetchTransactions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [address, isConnected, fetchTransactions, refreshInterval]);

  return { transactions, loading, error, refetch: fetchTransactions };
};

export default useUserTransactions;






