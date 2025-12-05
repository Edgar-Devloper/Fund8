import React, { useState, useEffect } from 'react';
import { useWallet } from '../../../context/WalletContext.js';
import { useTradingData } from './context/HyperliquidTradingProvider.js';
import { useUserBalance } from '../../../hooks/useUserBalance.js';
import hyperliquidTrading from '../../../services/hyperliquidTrading.js';
import { useNotifications } from '../../../context/NotificationContext.js';

const WithdrawModal = ({ onClose }) => {
  const { address, isConnected } = useWallet();
  const { tradingInitialized } = useTradingData();
  const { userState } = useUserBalance();
  const { addNotification } = useNotifications();
  
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState(address || '');
  const [coin, setCoin] = useState('USDC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const withdrawable = parseFloat(userState?.withdrawable || 0);

  // Set destination to connected address when wallet connects
  useEffect(() => {
    if (address) {
      setDestination(address);
    }
  }, [address]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, loading]);

  const handleMax = () => {
    if (withdrawable > 0) {
      setAmount(withdrawable.toString());
    }
  };

  const validateAddress = (addr) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleWithdraw = async () => {
    setError(null);

    // Validations
    if (!isConnected || !tradingInitialized) {
      setError('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > withdrawable) {
      setError(`Insufficient balance. Maximum withdrawable: ${withdrawable.toFixed(2)}`);
      return;
    }

    if (!destination || !validateAddress(destination)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setLoading(true);

    try {
      const result = await hyperliquidTrading.withdraw({
        coin: coin,
        amount: parseFloat(amount),
        destination: destination
      });

      if (result.success) {
        addNotification({
          type: 'success',
          message: `Withdrawal of ${amount} ${coin} initiated successfully`,
          duration: 5000
        });
        onClose();
        // Clear form
        setAmount('');
        setDestination(address || '');
      } else {
        setError(result.error || 'Withdrawal failed');
      }
    } catch (err) {
      console.error('[WithdrawModal] Error:', err);
      setError(err.message || 'An error occurred during withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="withdraw-modal-overlay" 
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="withdraw-modal-content">
        <div className="withdraw-modal-header">
          <h5>Withdraw</h5>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <div className="withdraw-modal-body">
          {!isConnected && (
            <div className="withdraw-warning">
              <p>⚠️ Please connect your wallet to withdraw funds</p>
            </div>
          )}

          {isConnected && (
            <>
              <div className="withdraw-balance-info">
                <span className="balance-label">Available:</span>
                <span className="balance-value">{withdrawable.toFixed(2)} USDC</span>
              </div>

              <div className="withdraw-form-group">
                <label>Amount</label>
                <div className="amount-input-group">
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    max={withdrawable}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="amount-input"
                    disabled={loading}
                  />
                  <button 
                    className="max-btn"
                    onClick={handleMax}
                    disabled={loading || withdrawable <= 0}
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div className="withdraw-form-group">
                <label>Destination Address</label>
                <input 
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="0x..."
                  className="address-input"
                  disabled={loading}
                />
                {destination && !validateAddress(destination) && (
                  <span className="error-text">Invalid address format</span>
                )}
              </div>

              <div className="withdraw-form-group">
                <label>Asset</label>
                <select 
                  value={coin}
                  onChange={(e) => setCoin(e.target.value)}
                  className="coin-select"
                  disabled={loading}
                >
                  <option value="USDC">USDC</option>
                </select>
              </div>

              {error && (
                <div className="withdraw-error">
                  <p>{error}</p>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="withdraw-modal-footer">
          <button 
            className="btn-cancel" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="btn-withdraw"
            onClick={handleWithdraw}
            disabled={loading || !isConnected || !tradingInitialized}
          >
            {loading ? 'Processing...' : 'Withdraw'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;















