/**
 * ConnectWalletButton - Botón para conectar wallet con ethers.js
 * Sin Thirdweb, solo ethers.js puro
 */

import React from 'react';
import { useWallet } from '../../../context/WalletContext.js';
import { useTranslation } from 'react-i18next';
import './ConnectWalletButton.css';

const ConnectWalletButton = () => {
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const { t } = useTranslation(); // eslint-disable-line

  // Formato corto de la dirección
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="wallet-connect-container-hyperliquid">
      {isConnected && address ? (
        // Wallet conectada - Estilo Hyperliquid con dropdown
        <div className="wallet-connected-dropdown">
          <button className="wallet-address-btn">
            <span className="wallet-dot"></span>
            <span className="wallet-address">{formatAddress(address)}</span>
            <span className="wallet-arrow">▾</span>
          </button>
          <div className="wallet-dropdown-menu">
            <button 
              onClick={disconnectWallet}
              className="wallet-dropdown-item disconnect"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.6667 11.3333L14 7.99999L10.6667 4.66666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        // Botón connect - Estilo Hyperliquid
        <button
          onClick={connectWallet}
          className="wallet-connect-btn"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </button>
      )}
    </div>
  );
};

export default ConnectWalletButton;
