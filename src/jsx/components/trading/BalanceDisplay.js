import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../../../context/WalletContext';
import hyperliquidTrading from '../../../services/hyperliquidTrading';
import './BalanceDisplay.css';

const BalanceDisplay = () => {
  const { isConnected, address } = useWallet();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!isConnected || !address) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      setLoading(true);
      try {
        const userState = await hyperliquidTrading.getUserState();
        
        if (userState) {
          // Extract balance info from clearinghouse state
          const crossMarginSummary = userState.crossMarginSummary;
          const accountValue = parseFloat(crossMarginSummary?.accountValue || 0);
          const withdrawable = parseFloat(userState.withdrawable || 0);
          const marginUsed = accountValue - withdrawable;
          
          setBalance({
            total: accountValue,
            available: withdrawable,
            inOrders: marginUsed,
            currency: 'USDC'
          });
        } else {
          // Default empty balance
          setBalance({
            total: 0,
            available: 0,
            inOrders: 0,
            currency: 'USDC'
          });
        }
      } catch (error) {
        console.error('[BalanceDisplay] Error fetching balance:', error);
        setBalance({
          total: 0,
          available: 0,
          inOrders: 0,
          currency: 'USDC'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    
    return () => clearInterval(interval);
  }, [isConnected, address]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDetails(false);
      }
    };

    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetails]);

  if (!isConnected || !balance) {
    return null;
  }

  const formatBalance = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="balance-display-container" ref={containerRef}>
      <div 
        ref={buttonRef}
        className="balance-display"
        onClick={() => setShowDetails(!showDetails)}
      >
        <span className="balance-label">Balance</span>
        <span className="balance-value">
          {loading ? (
            <span className="balance-loading">...</span>
          ) : (
            formatBalance(balance.total)
          )}
        </span>
        <span className="balance-currency">{balance.currency}</span>
      </div>

      {showDetails && buttonRef.current && (
        <div 
          className="balance-details-dropdown"
          style={{
            right: `${window.innerWidth - buttonRef.current.getBoundingClientRect().right}px`
          }}
        >
          <div className="balance-detail-row">
            <span className="detail-label">Available:</span>
            <span className="detail-value">${balance.available.toFixed(2)}</span>
          </div>
          <div className="balance-detail-row">
            <span className="detail-label">In Orders:</span>
            <span className="detail-value">${balance.inOrders.toFixed(2)}</span>
          </div>
          <div className="balance-detail-row total">
            <span className="detail-label">Total:</span>
            <span className="detail-value">${balance.total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceDisplay;


