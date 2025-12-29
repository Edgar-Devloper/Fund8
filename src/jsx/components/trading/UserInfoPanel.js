import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useWallet } from '../../../context/WalletContext';
import { useUserBalance } from '../../../hooks/useUserBalance';
import { useNFT } from '../../../context/NFTContext';

/**
 * UserInfoPanel - Muestra información del usuario
 * - Wallet address
 * - Balance USDC en BNB
 * - Email
 * - NFT ID / Username
 */
const UserInfoPanel = () => {
  const { t } = useTranslation();
  const { address, isConnected } = useWallet();
  const { userState, loading: balanceLoading } = useUserBalance();
  const { selectedNFT } = useNFT();
  const { tradingPortal, auth } = useSelector(state => state.auth);

  // Obtener email
  const userEmail = tradingPortal?.email || auth?.email || localStorage.getItem('trading_portal_remembered_email') || null;

  // Obtener balance USDC
  const usdcBalance = userState?.withdrawable 
    ? parseFloat(userState.withdrawable) 
    : userState?.crossMarginSummary?.accountValue 
      ? parseFloat(userState.crossMarginSummary.accountValue) 
      : 0;

  // Formatear dirección
  const formatAddress = (addr) => {
    if (!addr) return 'Not Connected';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div style={{
      background: '#151a2e',
      border: '1px solid #1e2541',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Wallet Address */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 12px',
          background: '#0a0e27',
          borderRadius: '8px',
          border: '1px solid #1e2541'
        }}>
          <span style={{ color: '#a0aec0', fontSize: '13px', fontWeight: '500' }}>
            {t('user_info.wallet', 'Wallet')}:
          </span>
          <span style={{ 
            color: '#00c087', 
            fontSize: '13px', 
            fontWeight: '600',
            fontFamily: 'monospace'
          }} title={address}>
            {formatAddress(address)}
          </span>
        </div>

        {/* Balance USDC */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 12px',
          background: '#0a0e27',
          borderRadius: '8px',
          border: '1px solid #1e2541'
        }}>
          <span style={{ color: '#a0aec0', fontSize: '13px', fontWeight: '500' }}>
            {t('user_info.balance_usdc', 'Balance USDC')}:
          </span>
          <span style={{ 
            color: '#ffffff', 
            fontSize: '13px', 
            fontWeight: '600'
          }}>
            {balanceLoading ? (
              <span style={{ color: '#718096' }}>Loading...</span>
            ) : (
              formatCurrency(usdcBalance)
            )}
          </span>
        </div>

        {/* Email */}
        {userEmail && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            background: '#0a0e27',
            borderRadius: '8px',
            border: '1px solid #1e2541'
          }}>
            <span style={{ color: '#a0aec0', fontSize: '13px', fontWeight: '500' }}>
              {t('user_info.email', 'Email')}:
            </span>
            <span style={{ 
              color: '#ffffff', 
              fontSize: '13px', 
              fontWeight: '500',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }} title={userEmail}>
              {userEmail}
            </span>
          </div>
        )}

        {/* NFT ID / Username */}
        {selectedNFT && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            background: '#0a0e27',
            borderRadius: '8px',
            border: '1px solid #1e2541'
          }}>
            <span style={{ color: '#a0aec0', fontSize: '13px', fontWeight: '500' }}>
              {t('user_info.nft_id', 'NFT ID')}:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                color: '#00c087', 
                fontSize: '13px', 
                fontWeight: '600',
                fontFamily: 'monospace'
              }}>
                #{selectedNFT.tokenId}
              </span>
              <span style={{
                fontSize: '11px',
                padding: '2px 6px',
                background: selectedNFT.type === 'defily' 
                  ? 'rgba(0, 229, 204, 0.1)' 
                  : 'rgba(0, 192, 135, 0.1)',
                color: selectedNFT.type === 'defily' ? '#00e5cc' : '#00c087',
                borderRadius: '4px',
                border: `1px solid ${selectedNFT.type === 'defily' 
                  ? 'rgba(0, 229, 204, 0.2)' 
                  : 'rgba(0, 192, 135, 0.2)'}`
              }}>
                {selectedNFT.type === 'defily' ? 'DeFily' : 'Fund8'}
              </span>
            </div>
          </div>
        )}

        {/* NFT Name (si está disponible) */}
        {selectedNFT && selectedNFT.name && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            background: '#0a0e27',
            borderRadius: '8px',
            border: '1px solid #1e2541'
          }}>
            <span style={{ color: '#a0aec0', fontSize: '13px', fontWeight: '500' }}>
              {t('user_info.username', 'Username')}:
            </span>
            <span style={{ 
              color: '#ffffff', 
              fontSize: '13px', 
              fontWeight: '500'
            }}>
              {selectedNFT.name}
            </span>
          </div>
        )}

        {/* Mensaje si no hay NFT */}
        {!selectedNFT && (
          <div style={{
            padding: '10px 12px',
            background: '#0a0e27',
            borderRadius: '8px',
            border: '1px solid #1e2541',
            textAlign: 'center'
          }}>
            <span style={{ color: '#718096', fontSize: '12px' }}>
              {t('user_info.no_nft', 'No NFT selected')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfoPanel;



