import { createWallet, ecosystemWallet } from "thirdweb/wallets";
import { darkTheme } from "thirdweb/react";
import { thirdwebSelectedChain } from "../chains/thirdweb.chain";
import { polygon } from "thirdweb/chains";

const ecosystemId = process.env.REACT_APP_ECOSYSTEM_ID;
const partnerId = process.env.REACT_APP_PARTNER_ID;

const configuredWallets = [createWallet("io.metamask")];

if (ecosystemId) {
  configuredWallets.push(
    ecosystemWallet(`ecosystem.${ecosystemId}`, {
      partnerId,
    })
  );
}

export const wallets = configuredWallets;

export const getConnectButtonOptions = (t) => {
  return {
    wallets,
    chain: thirdwebSelectedChain,
    connectModal: {
      size: "wide",
      title: t("Connect to Fund8"),
      titleIcon: "/logo.png",
      showThirdwebBranding: false,
      welcomeScreen: {
        title: t("Welcome to Fund8"),
        subtitle: t("Connect your wallet to access the trading platform"),
        img: {
          src: "/logo.png",
          width: 100,
          height: 100,
        },
      },
    },
    appMetadata: {
      name: "Fund8 Wallet",
      url: typeof window !== 'undefined' ? window.location.origin : '',
      logoUrl: "/logo.png",
    },
    theme: darkTheme({
      colors: {
        // Modal & Container backgrounds
        modalBg: "#1c1249",
        borderColor: "#ffffff1a",
        separatorLine: "#2a2458",
        accentText: "#7A2FF4",

        // Text colors
        primaryText: "#ffffff",
        secondaryText: "#A9AEB4",

        // Primary buttons
        primaryButtonBg: "#7A2FF4",
        primaryButtonText: "#ffffff",

        // Secondary buttons
        secondaryButtonBg: "#2a2458",
        secondaryButtonText: "#ffffff",
        secondaryButtonHoverBg: "#39307B",

        // Accent buttons
        accentButtonBg: "#7A2FF4",
        accentButtonText: "#ffffff",

        // Connected state button
        connectedButtonBg: "#39307B",
        connectedButtonBgHover: "#7A2FF4",

        // States
        success: "#04ae4b",
        danger: "#FF4C5A",

        // Tooltips & overlays
        tooltipBg: "#1c1249",
        tooltipText: "#ffffff",

        // Selection states
        selectedTextColor: "#ffffff",
        selectedTextBg: "#7A2FF4",

        // Icons
        secondaryIconColor: "#A9AEB4",
        secondaryIconHoverColor: "#ffffff",
        secondaryIconHoverBg: "#ffffff1a",
      },
    }),
    chains: [thirdwebSelectedChain, polygon],
  };
};
