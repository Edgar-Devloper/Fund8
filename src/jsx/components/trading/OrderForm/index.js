import React, { useState, useEffect } from 'react';
import { useTradingData } from '../context/HyperliquidTradingProvider';
import { useWallet } from '../../../../context/WalletContext.js';
import { useNFT } from '../../../../context/NFTContext.js';
import { useNotifications } from '../../../../context/NotificationContext.js';
import { useTranslation } from 'react-i18next';
import NFTSelectionModal from '../../../components/NFTSelectionModal';

const getNftMetadata = async (ipfsLink) => {
  if (!ipfsLink || !ipfsLink.includes('.json')) {
    return null;
  }

  try {
    const ipfsCid = ipfsLink.split('//')[1];
    const metadataUrl = `https://ipfs.io/ipfs/${ipfsCid}`;
    
    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch NFT metadata');
    }
    
    const metadata = await response.json();
    
    if (metadata.image) {
      metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    return metadata;
  } catch (error) {
    console.error('[NFT Metadata] Error fetching metadata:', error);
    return null;
  }
};

const getImageUrl = (ipfsLink, tokenId = null, metadata = null) => {
  if (!ipfsLink || ipfsLink.trim() === '') {
    return null;
  }
  
  if (metadata && metadata.image) {
    return metadata.image;
  }
  
  let cleanLink = ipfsLink.trim();
  
  if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
    return cleanLink;
  }
  
  if (cleanLink.startsWith('ipfs://')) {
    let cid = cleanLink.replace('ipfs://', '').trim();
    
    if (cleanLink.includes('.json')) {
      const parts = cid.split('/');
      cid = parts[0];
      if (tokenId) {
        return `https://ipfs.io/ipfs/${cid}/${tokenId}.png`;
      }
      return `https://ipfs.io/ipfs/${cid}`;
    }
    
    return `https://ipfs.io/ipfs/${cid}`;
  }
  
  if (cleanLink.match(/^[a-zA-Z0-9]{46,59}$/) || cleanLink.startsWith('Qm') || cleanLink.startsWith('bafy')) {
    return `https://ipfs.io/ipfs/${cleanLink}${tokenId ? `/${tokenId}.png` : ''}`;
  }
  
  return `https://ipfs.io/ipfs/${cleanLink}`;
};

const OrderForm = () => {
  const { selectedSymbol, placeOrder, orderBook, tickers, tradingInitialized, selectedPrice, setSelectedPrice } = useTradingData();
  const { isConnected, connectWallet, isConnecting } = useWallet();
  const { selectedNFT } = useNFT();
  const { addNotification } = useNotifications();
  const { t } = useTranslation();
  
  const [side, setSide] = useState('buy');
  const [orderType, setOrderType] = useState('limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [nftImageUrl, setNftImageUrl] = useState(null);
  const [nftMetadata, setNftMetadata] = useState(null);
  
  const currentTicker = tickers.find(t => t.symbol === selectedSymbol) || { last: 0 };
  const bestBid = orderBook?.bids?.[0]?.price || 0;
  const bestAsk = orderBook?.asks?.[0]?.price || 0;
  const midPrice = bestBid && bestAsk ? ((bestBid + bestAsk) / 2) : currentTicker.last;
  
  useEffect(() => {
    if (selectedPrice && orderType === 'limit') {
      setPrice(selectedPrice.toFixed(2));
      setSelectedPrice(null); // Clear after using
    }
  }, [selectedPrice, orderType, setSelectedPrice]);
  
  useEffect(() => {
    if (orderType === 'market') {
      setPrice('');
    } else if (!price && midPrice > 0) {
      setPrice(midPrice.toFixed(2));
    }
  }, [orderType, midPrice, price]);

  useEffect(() => {
    if (selectedNFT && selectedNFT.ipfsLink) {
      if (selectedNFT.ipfsLink.includes('.json') && !nftMetadata) {
        getNftMetadata(selectedNFT.ipfsLink).then(meta => {
          if (meta && meta.image) {
            setNftMetadata(meta);
            setNftImageUrl(meta.image);
          } else {
            setNftImageUrl(getImageUrl(selectedNFT.ipfsLink, selectedNFT.tokenId));
          }
        }).catch(() => {
          setNftImageUrl(getImageUrl(selectedNFT.ipfsLink, selectedNFT.tokenId));
        });
      } else {
        setNftImageUrl(getImageUrl(selectedNFT.ipfsLink, selectedNFT.tokenId, nftMetadata));
      }
    } else {
      setNftImageUrl(null);
      setNftMetadata(null);
    }
  }, [selectedNFT, nftMetadata]);
  
  const handlePriceClick = (priceValue) => {
    if (orderType === 'limit') {
      setPrice(priceValue.toFixed(2));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      addNotification({
        type: 'warning',
        title: t('trading.wallet_not_connected'),
        message: t('trading.connect_wallet_to_place_orders')
      });
      return;
    }
    
    if (!selectedNFT) {
      addNotification({
        type: 'warning',
        title: t('nft.no_nft_selected'),
        message: t('nft.select_nft_to_trade')
      });
      return;
    }
    
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      addNotification({
        type: 'warning',
        title: t('trading.invalid_price'),
        message: t('trading.enter_valid_price')
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      addNotification({
        type: 'warning',
        title: t('trading.invalid_amount'),
        message: t('trading.enter_valid_amount')
      });
      return;
    }
    
    if (!tradingInitialized) {
      addNotification({
        type: 'warning',
        title: 'Trading Not Ready',
        message: 'Trading service is initializing. Please wait a moment and try again.'
      });
      return;
    }
    
    setLoading(true);
    try {
      const orderPrice = orderType === 'market' ? midPrice : parseFloat(price);
      const total = (orderPrice * parseFloat(amount)).toFixed(2);
      
      addNotification({
        type: 'info',
        title: '⏳ Placing Order...',
        message: `${side.toUpperCase()} ${amount} ${selectedSymbol.split('/')[0]} ${orderType === 'market' ? 'at market price' : `@ $${orderPrice}`}`
      });
      
      const result = await placeOrder({
        side,
        type: orderType,
        price: orderPrice,
        size: parseFloat(amount),
        nftId: selectedNFT.tokenId
      });
      
      if (result.success) {
        setLastOrderId(result.orderId);
        
        addNotification({
          type: 'success',
          title: '✅ Order Placed Successfully!',
          message: `${side.toUpperCase()} ${amount} ${selectedSymbol.split('/')[0]} ${orderType === 'market' ? 'at market' : `@ $${orderPrice}`}\nTotal: $${total}${result.orderId ? `\nOrder ID: ${result.orderId}` : ''}`
        });
        
        setAmount('');
        if (orderType === 'limit') {
          setPrice(midPrice.toFixed(2));
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      addNotification({
        type: 'error',
        title: '❌ Order Failed',
        message: error.message || t('trading.error_placing_order')
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="card order-form-container">
      <div className="order-form-header">
        <h6 className="mb-0 fw-semibold" style={{letterSpacing:'.4px'}}>{t('trading.order_form')}</h6>
        <div className="d-flex align-items-center gap-2">
          {selectedNFT && isConnected && (
            <span 
              className="badge" 
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setShowNFTModal(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={`${t('nft.nft_selected')}: ${selectedNFT.name} (ID: ${selectedNFT.tokenId}) - ${t('nft.click_to_change') || 'Click para cambiar'}`}
            >
              {nftImageUrl ? (
                <img
                  src={nftImageUrl}
                  alt={selectedNFT.name}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="fa fa-image" style={{ fontSize: '10px' }}></i>
                </div>
              )}
              <span>NFT: {selectedNFT.name} #{selectedNFT.tokenId}</span>
            </span>
          )}
        {isConnected && (
          <span className="wallet-status-badge connected">
            <span className="status-dot"></span>
              {t('trading.connected')}
          </span>
        )}
        </div>
      </div>
      <div className="order-form-body" style={{padding:'14px 16px 18px'}}>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn ${side === 'buy' ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => setSide('buy')}
                style={{ 
                  fontWeight: 600, 
                  fontSize: '15px',
                  color: side === 'buy' ? '#ffffff' : 'var(--hl-accent-green, #00c087)',
                  padding: '10px 20px'
                }}
              >
                BUY
              </button>
              <button
                type="button"
                className={`btn ${side === 'sell' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => setSide('sell')}
                style={{ 
                  fontWeight: 600, 
                  fontSize: '15px',
                  color: side === 'sell' ? '#ffffff' : 'var(--hl-accent-red, #ff5c5c)',
                  padding: '10px 20px'
                }}
              >
                SELL
              </button>
            </div>
          </div>
          
          {!isConnected && (
            <button 
              type="button"
              className="wallet-required-notice clickable"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 5.33333H2C1.63181 5.33333 1.33333 5.63181 1.33333 6V13.3333C1.33333 13.7015 1.63181 14 2 14H14C14.3682 14 14.6667 13.7015 14.6667 13.3333V6C14.6667 5.63181 14.3682 5.33333 14 5.33333Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.6667 14V3.33333C10.6667 2.97971 10.5262 2.64057 10.2761 2.39052C10.0261 2.14048 9.68696 2 9.33333 2H6.66667C6.31304 2 5.97391 2.14048 5.72386 2.39052C5.47381 2.64057 5.33333 2.97971 5.33333 3.33333V14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{isConnecting ? 'Connecting...' : 'Connect wallet to start trading'}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="arrow-icon">
                <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          
          <div className="mb-3">
            <label className="form-label small text-muted">{t('trading.order_type')}</label>
            <select
              className="form-select form-select-sm"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
            >
              <option value="limit">{t('trading.limit')}</option>
              <option value="market">{t('trading.market')}</option>
            </select>
          </div>
          
          {orderType === 'limit' && (
            <div className="mb-3">
              <label className="form-label small text-muted">{t('trading.price')} (USDC)</label>
              <div className="input-group input-group-sm">
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  required={orderType === 'limit'}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => handlePriceClick(bestBid)}
                  title={t('trading.use_best_bid')}
                >
                  Bid
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => handlePriceClick(bestAsk)}
                  title={t('trading.use_best_ask')}
                >
                  Ask
                </button>
              </div>
            </div>
          )}
          
          {orderType === 'market' && (
            <div className="mb-3">
              <div className="alert alert-info small mb-0">
                {t('trading.market_price')}: ${midPrice.toFixed(2)}
              </div>
            </div>
          )}
          
          <div className="mb-3">
            <label className="form-label small text-muted">{t('trading.amount')}</label>
            <input
              type="number"
              className="form-control form-control-sm"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.0001"
              min="0"
              required
            />
          </div>
          
          <div className="mb-3">
            <div className="d-flex justify-content-between small text-muted mb-1">
              <span>{t('trading.total')}:</span>
              <span>
                {amount && (orderType === 'market' ? midPrice : price) 
                  ? `$${((parseFloat(amount) || 0) * (orderType === 'market' ? midPrice : parseFloat(price) || 0)).toFixed(2)}`
                  : '$0.00'}
              </span>
            </div>
          </div>
          
          <button
            type="submit"
            className={`btn w-100 ${side === 'buy' ? 'btn-success' : 'btn-danger'}`}
            disabled={loading || !isConnected}
            style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              padding: '12px',
              textTransform: 'uppercase',
              color: '#ffffff'
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Processing...
              </>
            ) : (
              side === 'buy' ? 'BUY' : 'SELL'
            )}
          </button>
        </form>
      </div>
      {/* Modal de selección de NFT */}
      <NFTSelectionModal 
        forceShow={showNFTModal}
        onClose={() => setShowNFTModal(false)}
        onSelect={() => setShowNFTModal(false)}
      />
    </div>
  );
};

export default OrderForm;
