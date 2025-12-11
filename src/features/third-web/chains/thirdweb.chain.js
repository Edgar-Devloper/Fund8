import { defineChain } from "thirdweb/chains";

// Obtener la red del entorno
const envNetwork = 
  process.env.REACT_APP_PUBLIC_ENVIRONMENT ||
  process.env.REACT_APP_PUBLIC_ENVIROMENT ||
  process.env.REACT_APP_PUBLIC_NETWORK;

const isTestnet = (envNetwork || "").toLowerCase() === "bsctestnet";
const isProd = ["pro", "prod"].includes((envNetwork || "").toLowerCase());

const bscTestnet = {
  id: 97,
  name: "BSC Testnet",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  blockExplorers: {
    default: {
      name: "BscScan Testnet",
      url: "https://testnet.bscscan.com",
      apiUrl: "https://api-testnet.bscscan.com",
    },
  },
  testnet: true,
  rpcUrls: {
    default: {
      http: [
        "https://bsc-testnet-rpc.publicnode.com",
        "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
        "https://bsc-testnet.public.blastapi.io",
      ],
    },
  },
};

const bscProd = {
  id: 56,
  name: "bsc",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  blockExplorers: {
    default: {
      name: "BscScan",
      url: "https://bscscan.com",
      apiUrl: "https://api.bscscan.com",
    },
  },
  testnet: false,
  rpcUrls: {
    default: {
      http: ["https://bsc-rpc.publicnode.com", "https://binance.llamarpc.com", "https://bsc.drpc.org"],
    },
  },
};

// Configuración de Hyperliquid
const hyperliquidTestnet = {
  id: 998,
  name: "Hyperliquid EVM Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  blockExplorers: {
    default: {
      name: "Hyperliquid Explorer",
      url: "https://explorer.hyperliquid-testnet.xyz",
    },
  },
  testnet: true,
  rpcUrls: {
    default: {
      http: ["https://api.hyperliquid-testnet.xyz/evm"],
    },
  },
};

const hyperliquidMainnet = {
  id: 998, // Hyperliquid usa el mismo chainId para testnet y mainnet, pero diferente RPC
  name: "Hyperliquid EVM",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  blockExplorers: {
    default: {
      name: "Hyperliquid Explorer",
      url: "https://explorer.hyperliquid.xyz",
    },
  },
  testnet: false,
  rpcUrls: {
    default: {
      http: ["https://api.hyperliquid.xyz/evm"],
    },
  },
};

const selectedChainConfig = isTestnet ? bscTestnet : isProd ? bscProd : bscTestnet;

export const thirdwebSelectedChain = defineChain(selectedChainConfig);

// Exportar también las cadenas de Hyperliquid para usar en el ConnectButton
export const hyperliquidTestnetChain = defineChain(hyperliquidTestnet);
export const hyperliquidMainnetChain = defineChain(hyperliquidMainnet);
