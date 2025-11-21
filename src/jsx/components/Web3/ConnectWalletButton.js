/**
 * ConnectWalletButton - Botón para conectar wallet con ethers.js
 * Sin Thirdweb, solo ethers.js puro
 */

import React from 'react';
import { useWallet } from '../../../context/WalletContext.js';

const ConnectWalletButton = () => {
  const { address, isConnected, isConnecting, error, connectWallet, disconnectWallet } = useWallet();

  // Formato corto de la dirección
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="wallet-connect-container">
      {isConnected && address ? (
        <div className="d-flex align-items-center">
          {/* Dirección conectada */}
          <div className="me-3">
            <span className="badge badge-success badge-lg">
              <i className="fa fa-circle text-success me-1"></i>
              {formatAddress(address)}
            </span>
          </div>
          
          {/* Botón disconnect */}
          <button 
            onClick={disconnectWallet}
            className="btn btn-danger btn-sm"
            title="Desconectar wallet"
          >
            <i className="fa fa-sign-out me-1"></i>
            Disconnect
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={connectWallet}
            className="btn btn-primary btn-sm"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Conectando...
              </>
            ) : (
              <>
                <i className="fa fa-wallet me-2"></i>
                Connect Wallet
              </>
            )}
          </button>
          
          {error && (
            <div className="alert alert-danger alert-sm mt-2 mb-0 p-2">
              <small>{error}</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectWalletButton;
