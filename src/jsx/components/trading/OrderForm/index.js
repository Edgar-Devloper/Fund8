import React, { useState, useEffect } from 'react';
import { useTradingData } from '../context/HyperliquidTradingProvider';
import { useWallet } from '../../../../context/WalletContext.js';
import { useNotifications } from '../../../../context/NotificationContext.js';

const OrderForm = () => {
  const { selectedSymbol, placeOrder, orderBook, tickers } = useTradingData();
  const { isConnected } = useWallet();
  const { addNotification } = useNotifications();
  
  const [side, setSide] = useState('buy');
  const [orderType, setOrderType] = useState('limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  const currentTicker = tickers.find(t => t.symbol === selectedSymbol) || { last: 0 };
  const bestBid = orderBook?.bids?.[0]?.price || 0;
  const bestAsk = orderBook?.asks?.[0]?.price || 0;
  const midPrice = bestBid && bestAsk ? ((bestBid + bestAsk) / 2) : currentTicker.last;
  
  useEffect(() => {
    if (orderType === 'market') {
      setPrice('');
    } else if (!price && midPrice > 0) {
      setPrice(midPrice.toFixed(2));
    }
  }, [orderType, midPrice, price]);
  
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
        title: 'Wallet no conectada',
        message: 'Por favor, conecta tu wallet para colocar órdenes'
      });
      return;
    }
    
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      addNotification({
        type: 'warning',
        title: 'Precio inválido',
        message: 'Por favor, ingresa un precio válido'
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      addNotification({
        type: 'warning',
        title: 'Cantidad inválida',
        message: 'Por favor, ingresa una cantidad válida'
      });
      return;
    }
    
    setLoading(true);
    try {
      const orderPrice = orderType === 'market' ? midPrice : parseFloat(price);
      await placeOrder({
        side,
        type: orderType,
        price: orderPrice,
        size: parseFloat(amount)
      });
      
      addNotification({
        type: 'success',
        title: 'Orden Colocada',
        message: `Orden de ${side} de ${amount} ${selectedSymbol.split('/')[0]} @ $${orderPrice.toFixed(2)} colocada exitosamente`
      });
      
      setAmount('');
      if (orderType === 'limit') {
        setPrice(midPrice.toFixed(2));
      }
    } catch (error) {
      console.error('Error placing order:', error);
      addNotification({
        type: 'error',
        title: 'Error al Colocar Orden',
        message: error.message || 'Error al colocar la orden'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="card h-100" style={{borderRadius:22}}>
      <div className="card-header d-flex align-items-center" style={{padding:'10px 16px', borderTopLeftRadius:22, borderTopRightRadius:22}}>
        <h6 className="mb-0 fw-semibold" style={{letterSpacing:'.4px'}}>Order Form</h6>
        <span className={`badge ms-auto ${isConnected ? 'bg-success' : 'bg-warning'}`} style={{borderRadius:18}}>
          {isConnected ? 'Conectado' : 'Sin Wallet'}
        </span>
      </div>
      <div className="card-body d-flex flex-column" style={{padding:'14px 16px 18px'}}>
        {!isConnected && (
          <div className="alert alert-warning mb-3" role="alert">
            <small>Conecta tu wallet para colocar órdenes</small>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn ${side === 'buy' ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => setSide('buy')}
              >
                BUY
              </button>
              <button
                type="button"
                className={`btn ${side === 'sell' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => setSide('sell')}
              >
                SELL
              </button>
            </div>
          </div>
          
          <div className="mb-3">
            <label className="form-label small text-muted">Tipo de Orden</label>
            <select
              className="form-select form-select-sm"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
            >
              <option value="limit">Limit</option>
              <option value="market">Market</option>
            </select>
          </div>
          
          {orderType === 'limit' && (
            <div className="mb-3">
              <label className="form-label small text-muted">Precio (USDC)</label>
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
                  title="Usar mejor bid"
                >
                  Bid
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => handlePriceClick(bestAsk)}
                  title="Usar mejor ask"
                >
                  Ask
                </button>
              </div>
            </div>
          )}
          
          {orderType === 'market' && (
            <div className="mb-3">
              <div className="alert alert-info small mb-0">
                Precio de mercado: ${midPrice.toFixed(2)}
              </div>
            </div>
          )}
          
          <div className="mb-3">
            <label className="form-label small text-muted">Cantidad</label>
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
              <span>Total:</span>
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
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Procesando...
              </>
            ) : (
              `${side.toUpperCase()} ${selectedSymbol.split('/')[0]}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
