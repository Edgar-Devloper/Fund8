/**
 * ConnectWalletButton - Botón para conectar wallet usando Thirdweb (como DeFily)
 */

import React from 'react';
import ConnectWalletButtonComponent from '../../../features/third-web/components/connect-wallet-button.component';
import './ConnectWalletButton.css';

const ConnectWalletButton = () => {
  return (
    <div className="wallet-connect-container-hyperliquid">
      <ConnectWalletButtonComponent />
    </div>
  );
};

export default ConnectWalletButton;
