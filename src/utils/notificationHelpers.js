/**
 * notificationHelpers - Funciones helper para crear notificaciones de trading
 * Facilita la creación de notificaciones comunes
 */

/**
 * Notificación de orden ejecutada
 */
export const notifyOrderFilled = (addNotification, orderData) => {
  addNotification({
    type: 'success',
    title: 'Order Filled',
    message: `${orderData.side} ${orderData.quantity} ${orderData.symbol} @ $${orderData.price}`,
    actionUrl: '/orders',
    actionLabel: 'View Order',
  });
};

/**
 * Notificación de orden cancelada
 */
export const notifyOrderCancelled = (addNotification, orderData) => {
  addNotification({
    type: 'warning',
    title: 'Order Cancelled',
    message: `Order ${orderData.orderId} for ${orderData.symbol} has been cancelled`,
    actionUrl: '/orders',
    actionLabel: 'View Orders',
  });
};

/**
 * Notificación de orden colocada
 */
export const notifyOrderPlaced = (addNotification, orderData) => {
  addNotification({
    type: 'order',
    title: 'Order Placed',
    message: `${orderData.side} order for ${orderData.quantity} ${orderData.symbol} @ $${orderData.price}`,
    actionUrl: '/orders',
    actionLabel: 'View Order',
  });
};

/**
 * Notificación de error de conexión
 */
export const notifyConnectionError = (addNotification, errorMessage) => {
  addNotification({
    type: 'error',
    title: 'Connection Error',
    message: errorMessage || 'Failed to connect to trading server. Please check your connection.',
  });
};

/**
 * Notificación de alerta de precio
 */
export const notifyPriceAlert = (addNotification, symbol, price, direction) => {
  addNotification({
    type: 'info',
    title: 'Price Alert',
    message: `${symbol} price ${direction === 'above' ? 'rose above' : 'fell below'} $${price}`,
    actionUrl: '/trading',
    actionLabel: 'View Chart',
  });
};

/**
 * Notificación de cambio de posición
 */
export const notifyPositionChange = (addNotification, positionData) => {
  const pnl = positionData.pnl >= 0 ? '+' : '';
  addNotification({
    type: positionData.pnl >= 0 ? 'success' : 'error',
    title: 'Position Update',
    message: `${positionData.symbol} position: PnL ${pnl}${positionData.pnl.toFixed(2)}%`,
    actionUrl: '/my-wallet',
    actionLabel: 'View Position',
  });
};

/**
 * Notificación de wallet conectada
 */
export const notifyWalletConnected = (addNotification, address) => {
  addNotification({
    type: 'success',
    title: 'Wallet Connected',
    message: `Successfully connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
  });
};

/**
 * Notificación de wallet desconectada
 */
export const notifyWalletDisconnected = (addNotification) => {
  addNotification({
    type: 'info',
    title: 'Wallet Disconnected',
    message: 'Your wallet has been disconnected. Please reconnect to continue trading.',
  });
};






