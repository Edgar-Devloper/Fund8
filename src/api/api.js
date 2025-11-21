import axios from 'axios';

// determine api url based on environment
const getApiUrl = () => {
  // if explicit url is set, use it
  if (process.env.REACT_APP_HYPERLIQUID_API_URL) {
    return process.env.REACT_APP_HYPERLIQUID_API_URL;
  }
  
  // if env is testnet, use testnet url
  if (process.env.REACT_APP_HYPERLIQUID_ENV === 'testnet') {
    return 'https://api.hyperliquid-testnet.xyz';
  }
  
  // default to mainnet
  return 'https://api.hyperliquid.xyz';
};

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000'),
  headers: {
    'Content-Type': 'application/json',
  }
});

// log environment on initialization
if (process.env.NODE_ENV === 'development') {
  console.log('[Hyperliquid API] Environment:', process.env.REACT_APP_HYPERLIQUID_ENV || 'mainnet');
  console.log('[Hyperliquid API] Base URL:', getApiUrl());
}

api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development' && config.data?.type !== 'allMids') {
      console.log('[Hyperliquid API] Request:', config.data?.type, config.data?.coin || '');
    }
    return config;
  },
  (error) => {
    console.error('[Hyperliquid API] Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development' && response.config.data?.type !== 'allMids') {
      console.log('[Hyperliquid API] Response:', response.config.data?.type);
    }
    return response.data;
  },
  (error) => {
    console.error('[Hyperliquid API] Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
