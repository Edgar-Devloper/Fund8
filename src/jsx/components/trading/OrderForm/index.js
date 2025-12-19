import React, { useState, useEffect, useRef } from 'react';
import { useTradingData } from '../context/HyperliquidTradingProvider';
import { useWallet } from '../../../../context/WalletContext.js';
import { useNFT } from '../../../../context/NFTContext.js';
import { useNotifications } from '../../../../context/NotificationContext.js';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import NFTSelectionModal from '../../../components/NFTSelectionModal';
import { registerPendingOperation, registerSuccessfulOperation, registerFailedOperation } from '../../../../services/operationsService';
import { getNftMetadata, getImageUrl } from '../../../../utils/nftUtils';
import { useTradingPermissions } from '../../../../hooks/useTradingPermissions';
import swal from 'sweetalert';

const OrderForm = ({ orderConfig, setOrderConfig }) => {
  const { selectedSymbol, placeOrder, orderBook, tickers, tradingInitialized, selectedPrice, setSelectedPrice } = useTradingData();
  const { isConnected, connectWallet, isConnecting } = useWallet();
  const { selectedNFT } = useNFT();
  const { addNotification } = useNotifications();
  const { t } = useTranslation();
  const { canTrade, getRestrictionMessage } = useTradingPermissions();
  
  const [side, setSide] = useState('buy');
  const [loading, setLoading] = useState(false);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [nftImageUrl, setNftImageUrl] = useState(null);
  const [nftMetadata, setNftMetadata] = useState(null);
  const [sizeAnimating, setSizeAnimating] = useState(false);
  const [totalAnimating, setTotalAnimating] = useState(false);
  const prevAmountRef = useRef('');
  const prevTotalRef = useRef(0);
  const [showTooltip, setShowTooltip] = useState({ buy: false, sell: false });
  const [tooltipPosition, setTooltipPosition] = useState({ buy: { top: 0, left: 0 }, sell: { top: 0, left: 0 } });
  const tooltipRefs = { buy: useRef(null), sell: useRef(null) };
  
  const updateTooltipPosition = (type, element) => {
    if (element) {
      const rect = element.getBoundingClientRect();
      setTooltipPosition(prev => ({
        ...prev,
        [type]: {
          top: rect.top - 40,
          left: rect.left + (rect.width / 2)
        }
      }));
    }
  };
  
  // Use shared config from props, with fallback defaults
  const {
    orderType = 'limit',
    price = '',
    amount = '',
    marginMode = 'Cross',
    tpSl = false,
    hiddenOrder = false,
    reduceOnly = false,
    timeInForce = 'GTC',
    stopPrice = '',
    trailingPercent = ''
  } = orderConfig || {};
  
  const currentTicker = tickers.find(t => t.symbol === selectedSymbol) || { last: 0 };
  const bestBid = orderBook?.bids?.[0]?.price || 0;
  const bestAsk = orderBook?.asks?.[0]?.price || 0;
  const midPrice = bestBid && bestAsk ? ((bestBid + bestAsk) / 2) : currentTicker.last;
  
  // Update config when price is selected from order book
  useEffect(() => {
    if (selectedPrice && orderType === 'limit' && setOrderConfig) {
      setOrderConfig(prev => ({ ...prev, price: selectedPrice.toFixed(2) }));
      setSelectedPrice(null); // Clear after using
    }
  }, [selectedPrice, orderType, setSelectedPrice, setOrderConfig]);
  
  // Set default price when order type changes
  useEffect(() => {
    if (setOrderConfig) {
      if (orderType === 'market') {
        setOrderConfig(prev => ({ ...prev, price: '' }));
      } else if (!price && midPrice > 0) {
        setOrderConfig(prev => ({ ...prev, price: midPrice.toFixed(2) }));
      }
    }
  }, [orderType, midPrice, price, setOrderConfig]);

  // Animate size changes
  useEffect(() => {
    if (amount !== prevAmountRef.current && amount) {
      setSizeAnimating(true);
      prevAmountRef.current = amount;
      setTimeout(() => setSizeAnimating(false), 500);
    }
  }, [amount]);

  // Animate total changes
  useEffect(() => {
    const currentTotal = amount && (orderType === 'market' ? midPrice : price) 
      ? ((parseFloat(amount) || 0) * (orderType === 'market' ? midPrice : parseFloat(price) || 0))
      : 0;
    
    if (currentTotal !== prevTotalRef.current && currentTotal > 0) {
      setTotalAnimating(true);
      prevTotalRef.current = currentTotal;
      setTimeout(() => setTotalAnimating(false), 500);
    }
  }, [amount, price, midPrice, orderType]);

  // Load NFT image - optimized for faster switching (synchronized with TradingPairHeader)
  useEffect(() => {
    // Clear previous image immediately when NFT changes
    setNftImageUrl(null);
    setNftMetadata(null);
    
    if (selectedNFT && selectedNFT.ipfsLink) {
      const loadImage = async () => {
        try {
          // Try to get direct image URL first (faster)
          const directUrl = getImageUrl(selectedNFT.ipfsLink, selectedNFT.tokenId);
          
          // If it's a JSON metadata link, fetch metadata
          if (selectedNFT.ipfsLink.includes('.json')) {
            try {
              const meta = await getNftMetadata(selectedNFT.ipfsLink);
              if (meta && meta.image) {
                setNftMetadata(meta);
                // Use metadata image if available, otherwise use direct URL
                setNftImageUrl(meta.image || directUrl);
              } else {
                setNftImageUrl(directUrl);
              }
            } catch (metaError) {
              // If metadata fetch fails, use direct URL
              setNftImageUrl(directUrl);
            }
          } else {
            // Direct image URL
            setNftImageUrl(directUrl);
          }
        } catch (error) {
          console.error('[OrderForm] Error loading NFT image:', error);
          const url = getImageUrl(selectedNFT.ipfsLink, selectedNFT.tokenId);
          setNftImageUrl(url);
        }
      };
      loadImage();
    }
  }, [selectedNFT?.tokenId, selectedNFT?.ipfsLink]); // Only depend on tokenId and ipfsLink, not the whole object
  
  const handlePriceClick = (priceValue) => {
    if (orderType === 'limit' && setOrderConfig) {
      setOrderConfig(prev => ({ ...prev, price: priceValue.toFixed(2) }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar permisos de trading
    if (!canTrade) {
      const message = getRestrictionMessage();
      swal(
        t('trading_portal.trading_restricted', 'Trading Restricted'),
        message || t('trading_portal.connect_to_trade', 'Connect your wallet and create a Trading Portal account to access trading features'),
        'warning'
      );
      return;
    }
    
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
    
    // Validate price based on order type
    if ((orderType === 'limit' || orderType === 'post-only') && (!price || parseFloat(price) <= 0)) {
      addNotification({
        type: 'warning',
        title: t('trading.invalid_price'),
        message: t('trading.enter_valid_price')
      });
      return;
    }
    
    // Validate stop price for stop orders
    if ((orderType === 'stop-limit' || orderType === 'stop-market') && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      addNotification({
        type: 'warning',
        title: 'Invalid Stop Price',
        message: 'Please enter a valid stop price to trigger the order'
      });
      return;
    }
    
    // Validate limit price for stop-limit orders
    if (orderType === 'stop-limit' && (!price || parseFloat(price) <= 0)) {
      addNotification({
        type: 'warning',
        title: 'Invalid Limit Price',
        message: 'Please enter a valid limit price for the stop-limit order'
      });
      return;
    }
    
    // Validate trailing percent for trailing stop orders
    if (orderType === 'trailing-stop' && (!trailingPercent || parseFloat(trailingPercent) <= 0 || parseFloat(trailingPercent) > 100)) {
      addNotification({
        type: 'warning',
        title: 'Invalid Trailing Distance',
        message: 'Please enter a valid trailing distance between 0.01% and 100%'
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
    
    // Calculate order price based on order type
    let orderPrice;
    if (orderType === 'market' || orderType === 'stop-market') {
      orderPrice = midPrice;
    } else if (orderType === 'trailing-stop') {
      // For trailing stop, use current price (the stop will trail from here)
      orderPrice = midPrice;
    } else {
      orderPrice = parseFloat(price);
    }
    
    const total = (orderPrice * parseFloat(amount)).toFixed(2);
    const symbol = selectedSymbol.split('/')[0];
    
    // 1. Registrar operación como PENDIENTE (antes de ejecutar)
    try {
      await registerPendingOperation(selectedNFT.tokenId, {
        side: side, // 'buy' o 'sell'
        symbol: symbol,
        amount: parseFloat(amount),
        price: orderPrice,
        orderType: orderType, // 'limit' o 'market'
        source: 'hyperliquid'
      });
      console.log('[OrderForm] Operación registrada como PENDIENTE');
    } catch (error) {
      console.warn('[OrderForm] Error registrando operación pendiente (no crítico):', error);
    }
    
    try {
      addNotification({
        type: 'info',
        title: '⏳ Placing Order...',
        message: `${side.toUpperCase()} ${amount} ${symbol} ${orderType === 'market' ? 'at market price' : `@ $${orderPrice}`}`
      });
      
      const orderParams = {
        side,
        type: orderType,
        price: orderPrice,
        size: parseFloat(amount),
        nftId: selectedNFT.tokenId,
        reduceOnly: reduceOnly || false,
        timeInForce: timeInForce || 'GTC',
        hidden: hiddenOrder || false
      };
      
      // Add stop-specific parameters
      if (orderType === 'stop-limit' || orderType === 'stop-market') {
        orderParams.stopPrice = parseFloat(stopPrice);
      }
      
      if (orderType === 'trailing-stop') {
        orderParams.trailingPercent = parseFloat(trailingPercent);
      }
      
      if (orderType === 'post-only') {
        orderParams.postOnly = true;
      }
      
      const result = await placeOrder(orderParams);
      
      if (result.success) {
        setLastOrderId(result.orderId);
        
        // 2. Registrar operación como EXITOSA (después de ejecutar)
        try {
          await registerSuccessfulOperation(selectedNFT.tokenId, {
            side: side,
            symbol: symbol,
            amount: parseFloat(amount),
            price: orderPrice,
            orderType: orderType,
            orderId: result.orderId,
            hyperliquidOrderId: result.orderId,
            source: 'hyperliquid'
          });
          console.log('[OrderForm] Operación registrada como EXITOSA');
        } catch (error) {
          console.warn('[OrderForm] Error registrando operación exitosa (no crítico):', error);
        }
        
        addNotification({
          type: 'success',
          title: '✅ Order Placed Successfully!',
          message: `${side.toUpperCase()} ${amount} ${symbol} ${orderType === 'market' ? 'at market' : `@ $${orderPrice}`}\nTotal: $${total}${result.orderId ? `\nOrder ID: ${result.orderId}` : ''}`
        });
        
        // Reset form using shared config
        if (setOrderConfig) {
          setOrderConfig(prev => ({
            ...prev,
            amount: '',
            price: orderType === 'limit' ? midPrice.toFixed(2) : ''
          }));
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      
      // 3. Registrar operación como FALLIDA (si falla)
      try {
        await registerFailedOperation(selectedNFT.tokenId, {
          side: side,
          symbol: symbol,
          amount: parseFloat(amount),
          price: orderPrice,
          orderType: orderType,
          source: 'hyperliquid'
        }, error.message || 'Error desconocido al colocar orden');
        console.log('[OrderForm] Operación registrada como FALLIDA');
      } catch (regError) {
        console.warn('[OrderForm] Error registrando operación fallida (no crítico):', regError);
      }
      
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
            <div className="btn-group w-100" role="group" style={{ position: 'relative' }}>
              <div 
                ref={tooltipRefs.buy}
                className="tooltip-wrapper-disabled"
                style={{ position: 'relative', flex: 1 }}
                onMouseEnter={(e) => {
                  updateTooltipPosition('buy', e.currentTarget);
                  setShowTooltip(prev => ({ ...prev, buy: true }));
                }}
                onMouseLeave={() => setShowTooltip(prev => ({ ...prev, buy: false }))}
              >
                <button
                  type="button"
                  className={`btn ${side === 'buy' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => setSide('buy')}
                  disabled={true}
                  style={{ 
                    fontWeight: 600, 
                    fontSize: '15px',
                    color: side === 'buy' ? '#ffffff' : 'var(--hl-accent-green, #00c087)',
                    padding: '10px 20px',
                    opacity: 0.6,
                    cursor: 'not-allowed',
                    width: '100%'
                  }}
                >
                  BUY
                </button>
              </div>
              <div 
                ref={tooltipRefs.sell}
                className="tooltip-wrapper-disabled"
                style={{ position: 'relative', flex: 1 }}
                onMouseEnter={(e) => {
                  updateTooltipPosition('sell', e.currentTarget);
                  setShowTooltip(prev => ({ ...prev, sell: true }));
                }}
                onMouseLeave={() => setShowTooltip(prev => ({ ...prev, sell: false }))}
              >
                <button
                  type="button"
                  className={`btn ${side === 'sell' ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => setSide('sell')}
                  disabled={true}
                  style={{ 
                    fontWeight: 600, 
                    fontSize: '15px',
                    color: side === 'sell' ? '#ffffff' : 'var(--hl-accent-red, #ff5c5c)',
                    padding: '10px 20px',
                    opacity: 0.6,
                    cursor: 'not-allowed',
                    width: '100%'
                  }}
                >
                  SELL
                </button>
              </div>
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
          
          {/* Price Input for Limit and Post Only */}
          {(orderType === 'limit' || orderType === 'post-only') && (
            <div className="mb-3">
              <label className="form-label small text-muted d-flex align-items-center">
                <span>{t('trading.price')} (USDC)</span>
                {orderType === 'post-only' && (
                  <span className="info-icon-tooltip-inline ms-2" title="Post Only orders are placed as maker orders only. If the order would execute immediately as taker, it is rejected.">ℹ️</span>
                )}
              </label>
              <div className="input-group input-group-sm">
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  value={price || ''}
                  onChange={(e) => {
                    if (setOrderConfig) {
                      setOrderConfig(prev => ({ ...prev, price: e.target.value }));
                    }
                  }}
                  step="0.01"
                  min="0"
                  required={orderType === 'limit' || orderType === 'post-only'}
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

          {/* Stop Price Input for Stop Limit and Stop Market */}
          {(orderType === 'stop-limit' || orderType === 'stop-market') && (
            <>
              <div className="mb-3">
                <label className="form-label small text-muted d-flex align-items-center">
                  <span>Stop Price (USDC)</span>
                  <span className="info-icon-tooltip-inline ms-2" title="The price at which the stop order will be triggered. When this price is reached, the order will activate.">ℹ️</span>
                </label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                    value={orderConfig?.stopPrice || ''}
                    onChange={(e) => {
                      if (setOrderConfig) {
                        setOrderConfig(prev => ({ ...prev, stopPrice: e.target.value }));
                      }
                    }}
                    step="0.01"
                    min="0"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      if (setOrderConfig) {
                        setOrderConfig(prev => ({ ...prev, stopPrice: midPrice.toFixed(2) }));
                      }
                    }}
                    title="Use Current Price"
                  >
                    Current
                  </button>
                </div>
              </div>
              {orderType === 'stop-limit' && (
                <div className="mb-3">
                  <label className="form-label small text-muted d-flex align-items-center">
                    <span>Limit Price (USDC)</span>
                    <span className="info-icon-tooltip-inline ms-2" title="The price at which the order will execute after the stop is triggered. This is your maximum/minimum execution price.">ℹ️</span>
                  </label>
                  <div className="input-group input-group-sm">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0.00"
                      value={price || ''}
                      onChange={(e) => {
                        if (setOrderConfig) {
                          setOrderConfig(prev => ({ ...prev, price: e.target.value }));
                        }
                      }}
                      step="0.01"
                      min="0"
                      required
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
            </>
          )}

          {/* Trailing Stop Input */}
          {orderType === 'trailing-stop' && (
            <div className="mb-3">
              <label className="form-label small text-muted d-flex align-items-center">
                <span>Trailing Distance (%)</span>
                <span className="info-icon-tooltip-inline ms-2" title="The percentage distance the stop will trail behind the current price. If price rises, the stop adjusts upward. Protects profits while allowing gains.">ℹ️</span>
              </label>
              <div className="input-group input-group-sm">
                <input
                  type="number"
                  className="form-control"
                  placeholder="5.00"
                  value={orderConfig?.trailingPercent || ''}
                  onChange={(e) => {
                    if (setOrderConfig) {
                      setOrderConfig(prev => ({ ...prev, trailingPercent: e.target.value }));
                    }
                  }}
                  step="0.01"
                  min="0.01"
                  max="100"
                  required
                />
                <span className="input-group-text">%</span>
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
            <label className="form-label small text-muted d-flex justify-content-between align-items-center">
              <span>{t('trading.amount')}</span>
              {amount && parseFloat(amount) > 0 && (
                <span className={`size-display ${sizeAnimating ? 'updating' : ''}`} style={{ 
                  fontSize: '12px', 
                  fontWeight: 600,
                  color: 'var(--hl-accent-teal, #00e5cc)'
                }}>
                  Size: {parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                </span>
              )}
            </label>
            <input
              type="number"
              className="form-control form-control-sm"
              placeholder="0.0000"
              value={amount || ''}
              onChange={(e) => {
                if (setOrderConfig) {
                  setOrderConfig(prev => ({ ...prev, amount: e.target.value }));
                }
              }}
              step="0.0001"
              min="0"
              required
              style={{
                fontFeatureSettings: "'tnum'",
                fontWeight: 600,
                fontSize: '15px'
              }}
            />
            {amount && parseFloat(amount) > 0 && (
              <div className="mt-1 d-flex justify-content-between align-items-center">
                <small className="text-muted" style={{ fontSize: '10px' }}>
                  {parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {selectedSymbol.split('/')[0]}
                </small>
                <div className="size-indicator" style={{
                  width: `${Math.min((parseFloat(amount) / 10) * 100, 100)}%`,
                  height: '2px',
                  background: 'linear-gradient(90deg, var(--hl-accent-teal, #00e5cc), var(--hl-accent-green, #00c087))',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease',
                  opacity: 0.6
                }}></div>
              </div>
            )}
          </div>
          
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center small mb-1" style={{
              padding: '8px 12px',
              background: 'var(--hl-dark-bg, #0a0e27)',
              borderRadius: '6px',
              border: '1px solid var(--hl-dark-border, #1e2541)'
            }}>
              <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('trading.total')}:</span>
              <span className={`animated-number ${totalAnimating ? 'changing' : ''}`} style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--hl-text-primary, #ffffff)',
                fontFeatureSettings: "'tnum'"
              }}>
                {amount && (orderType === 'market' ? midPrice : price) 
                  ? `$${((parseFloat(amount) || 0) * (orderType === 'market' ? midPrice : parseFloat(price) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '$0.00'}
              </span>
            </div>
          </div>
          
          <button
            type="submit"
            className={`btn w-100 ${side === 'buy' ? 'btn-success' : 'btn-danger'}`}
            disabled={loading || !isConnected || !canTrade}
            style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              padding: '12px',
              textTransform: 'uppercase',
              color: '#ffffff',
              opacity: (!isConnected || !canTrade) ? 0.5 : 1,
              cursor: (!isConnected || !canTrade) ? 'not-allowed' : 'pointer'
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
        {/* Tooltips renderizados fuera del contenedor */}
        {showTooltip.buy && (
          <div
            style={{
              position: 'fixed',
              top: `${tooltipPosition.buy.top}px`,
              left: `${tooltipPosition.buy.left}px`,
              transform: 'translateX(-50%)',
              padding: '6px 12px',
              background: 'rgba(0, 0, 0, 0.9)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              borderRadius: '4px',
              zIndex: 99999,
              pointerEvents: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            {t('trading.coming_soon', 'Próximamente')}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                border: '5px solid transparent',
                borderTopColor: 'rgba(0, 0, 0, 0.9)'
              }}
            />
          </div>
        )}
        {showTooltip.sell && (
          <div
            style={{
              position: 'fixed',
              top: `${tooltipPosition.sell.top}px`,
              left: `${tooltipPosition.sell.left}px`,
              transform: 'translateX(-50%)',
              padding: '6px 12px',
              background: 'rgba(0, 0, 0, 0.9)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              borderRadius: '4px',
              zIndex: 99999,
              pointerEvents: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            {t('trading.coming_soon', 'Próximamente')}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                border: '5px solid transparent',
                borderTopColor: 'rgba(0, 0, 0, 0.9)'
              }}
            />
          </div>
        )}
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
