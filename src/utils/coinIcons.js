import btcIcon from '../images/icons/btc.png';
import ethIcon from '../images/icons/eth.png';
import solIcon from '../images/icons/sol.png';
import ltcIcon from '../images/icons/ltc.png';
import moneroIcon from '../images/icons/monero.png';
import adaIcon from '../images/icons/ada.png';
import dogeIcon from '../images/icons/doge.png';
import bnbIcon from '../images/icons/bnb.png';
import avaxIcon from '../images/icons/avax.png';
import atomIcon from '../images/icons/atom.png';
import maticIcon from '../images/icons/matic.png';
import dydxIcon from '../images/icons/dydx.png';
import xrpIcon from '../images/icons/xrp.png';
import chainlinkIcon from '../images/icons/chainlink.png';
import aaveIcon from '../images/icons/aave.png';
import suiIcon from '../images/icons/sui.png';
import aptosIcon from '../images/icons/aptos.png';
import arbitrumIcon from '../images/icons/arbitrum.png';
import uniswapIcon from '../images/icons/uniswap.png';
import optimismIcon from '../images/icons/optimism.png';
import nearIcon from '../images/icons/near.png';
import injectiveIcon from '../images/icons/injective.png';
import celestiaIcon from '../images/icons/celestia.png';
import bittensorIcon from '../images/icons/bittensor.png';
import makerIcon from '../images/icons/maker.png';
import filecoinIcon from '../images/icons/filecoin.png';
import pendleIcon from '../images/icons/pendle.png';
import dogwifhatIcon from '../images/icons/dogwifhat.png';
import ethenaIcon from '../images/icons/ethena.png';
import paxgIcon from '../images/icons/paxg.png';
import usdcIcon from '../images/icons/USDC.png';

export const localIconMap = {
  'BTC': btcIcon,
  'ETH': ethIcon,
  'SOL': solIcon,
  'LTC': ltcIcon,
  'XMR': moneroIcon,
  'MONERO': moneroIcon,
  'ADA': adaIcon,
  'DOGE': dogeIcon,
  'BNB': bnbIcon,
  'AVAX': avaxIcon,
  'AVALANCHE': avaxIcon,
  'ATOM': atomIcon,
  'MATIC': maticIcon,
  'POLYGON': maticIcon,
  'DYDX': dydxIcon,
  'XRP': xrpIcon,
  'LINK': chainlinkIcon,
  'CHAINLINK': chainlinkIcon,
  'AAVE': aaveIcon,
  'SUI': suiIcon,
  'APT': aptosIcon,
  'APTOS': aptosIcon,
  'ARB': arbitrumIcon,
  'ARBITRUM': arbitrumIcon,
  'UNI': uniswapIcon,
  'UNISWAP': uniswapIcon,
  'OP': optimismIcon,
  'OPTIMISM': optimismIcon,
  'NEAR': nearIcon,
  'INJ': injectiveIcon,
  'INJECTIVE': injectiveIcon,
  'TIA': celestiaIcon,
  'CELESTIA': celestiaIcon,
  'TAO': bittensorIcon,
  'BITTENSOR': bittensorIcon,
  'MKR': makerIcon,
  'MAKER': makerIcon,
  'FIL': filecoinIcon,
  'FILECOIN': filecoinIcon,
  'PENDLE': pendleIcon,
  'WIF': dogwifhatIcon,
  'DOGWIFHAT': dogwifhatIcon,
  'ENA': ethenaIcon,
  'ETHENA': ethenaIcon,
  'PAXG': paxgIcon,
  'USDC': usdcIcon,
};

export const symbolToCryptoLogosName = {
  'HYPE': 'hyperliquid-hype',
  'CRV': 'curve-dao-token',
  'ONDO': 'ondo-finance',
  'JUP': 'jupiter-exchange-solana',
  'HBAR': 'hedera-hashgraph',
  'TON': 'the-open-network',
  'XLM': 'stellar',
  'LDO': 'lido-dao',
  'TRUMP': 'trump',
  'RENDER': 'render-token-rndr',
  'RNDR': 'render-token-rndr',
};

/**
 * Obtiene URL de icono desde CDN de Cryptologos
 */
export const getCoinIconUrl = (symbol) => {
  const normalized = symbol?.toUpperCase() || '';
  const cryptoLogosName = symbolToCryptoLogosName[normalized];
  
  if (cryptoLogosName) {
    return `https://cryptologos.cc/logos/${cryptoLogosName}-logo.png`;
  }
  
  return `https://cryptologos.cc/logos/${normalized.toLowerCase()}-logo.png`;
};

export const getCoinIcon = (symbol) => {
  const normalized = symbol?.toUpperCase() || '';
  if (localIconMap[normalized]) {
    return localIconMap[normalized];
  }
  return null;
};

export const hasLocalIcon = (symbol) => {
  const normalized = symbol?.toUpperCase() || '';
  return !!localIconMap[normalized];
};

export const getAvailableLocalSymbols = () => {
  return Object.keys(localIconMap).filter(key => 
    !['MONERO', 'AVALANCHE', 'POLYGON', 'CHAINLINK', 'APTOS', 'ARBITRUM', 'UNISWAP', 'OPTIMISM', 'INJECTIVE', 'CELESTIA', 'BITTENSOR', 'MAKER', 'FILECOIN', 'DOGWIFHAT', 'ETHENA'].includes(key)
  );
};

