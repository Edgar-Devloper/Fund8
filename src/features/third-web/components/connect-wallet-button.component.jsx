import React from "react";
import { ConnectButton } from "thirdweb/react";
import { client } from "../libs/client.lib";
import { getConnectButtonOptions } from "../constants/connect-button-config.constant";
import { useTranslation } from "react-i18next";

const ConnectWalletButtonComponent = ({ className, ...props }) => {
  const { t } = useTranslation();
  
  // Si no hay client, mostrar mensaje
  if (!client) {
    return (
      <div className={className}>
        <button className="wallet-connect-btn" disabled style={{ opacity: 0.6 }}>
          {t("Connect Wallet")} (Configurar Thirdweb)
        </button>
      </div>
    );
  }

  const connectButtonOptions = getConnectButtonOptions(t);

  return (
    <div className={className}>
      <ConnectButton
        client={client}
        {...connectButtonOptions}
        {...props}
        autoConnect={true}
        connectButton={{ label: t("Connect Wallet") }}
      />
    </div>
  );
};

export default ConnectWalletButtonComponent;
