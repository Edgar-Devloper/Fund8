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

const selectedChainConfig = isTestnet ? bscTestnet : isProd ? bscProd : bscTestnet;

export const thirdwebSelectedChain = defineChain(selectedChainConfig);
