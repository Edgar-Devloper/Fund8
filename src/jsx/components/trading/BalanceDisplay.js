import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWallet } from '../../../context/WalletContext';
import { useUserBalance } from '../../../hooks/useUserBalance';
import { useTranslation } from 'react-i18next';
import './BalanceDisplay.css';

const BalanceDisplay = () => {
  const { isConnected, address } = useWallet();
  const { userState, loading } = useUserBalance(30000); // Refresh every 30 seconds
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  // Calculate balance from userState
  const balance = useMemo(() => {
    if (!userState || !isConnected || !address) {
      return null;
    }

    const crossMarginSummary = userState.crossMarginSummary || {};
    const accountValue = parseFloat(crossMarginSummary.accountValue || 0);
    const withdrawable = parseFloat(userState.withdrawable || 0);
    const marginUsed = accountValue - withdrawable;
    
    return {
      total: accountValue,
      available: withdrawable,
      inOrders: marginUsed,
      currency: 'USDC'
    };
  }, [userState, isConnected, address]);

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

  if (!isConnected) {
    return null;
  }

  const formatBalance = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  // Si no hay balance o está en 0, mostrar mensaje informativo
  const hasBalance = balance && balance.total > 0;

  return (
    <div className="balance-display-container" ref={containerRef}>
      <div 
        ref={buttonRef}
        className="balance-display"
        onClick={() => setShowDetails(!showDetails)}
        title={!hasBalance ? t('wallet.balance_in_hyperliquid_tooltip', 'Balance en Hyperliquid. Necesitas depositar USDC para empezar a tradear.') : t('wallet.balance_in_hyperliquid', 'Balance en Hyperliquid')}
      >
        <span className="balance-label">{t('wallet.balance', 'Balance')}</span>
        <span className="balance-value">
          {loading ? (
            <span className="balance-loading">...</span>
          ) : hasBalance ? (
            formatBalance(balance.total)
          ) : (
            <span style={{ opacity: 0.6 }}>$0.00</span>
          )}
        </span>
        <span className="balance-currency">{balance?.currency || 'USDC'}</span>
      </div>

      {showDetails && buttonRef.current && (
        <div 
          className="balance-details-dropdown"
          style={{
            right: `${window.innerWidth - buttonRef.current.getBoundingClientRect().right}px`
          }}
        >
          {hasBalance ? (
            <>
              <div className="balance-detail-row">
                <span className="detail-label">{t('wallet.available', 'Available')}:</span>
                <span className="detail-value">${balance.available.toFixed(2)}</span>
              </div>
              <div className="balance-detail-row">
                <span className="detail-label">{t('wallet.in_orders', 'In Orders')}:</span>
                <span className="detail-value">${balance.inOrders.toFixed(2)}</span>
              </div>
              <div className="balance-detail-row total">
                <span className="detail-label">{t('wallet.total', 'Total')}:</span>
                <span className="detail-value">${balance.total.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="balance-detail-row" style={{ padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '8px' }}>
                {t('wallet.balance_in_hyperliquid', 'Balance en Hyperliquid')}
              </div>
              <div style={{ fontSize: '11px', color: '#718096', lineHeight: '1.4' }}>
                {t('wallet.balance_in_hyperliquid_description', 'Este es tu balance en la plataforma de trading Hyperliquid.')}
                <br />
                {t('wallet.deposit_usdc_to_start', 'Para empezar a tradear, necesitas depositar USDC desde tu wallet.')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BalanceDisplay;


