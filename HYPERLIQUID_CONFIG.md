# Configuración de HyperLiquid

Este documento describe cómo configurar la integración con HyperLiquid API y WebSocket.

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

### Configuración Básica

```bash
# Entorno de HyperLiquid
REACT_APP_HYPERLIQUID_ENV=mainnet  # o 'testnet'

# Timeout de peticiones API (en milisegundos)
REACT_APP_API_TIMEOUT=10000
```

### URLs Personalizadas (Opcional)

Por defecto, las URLs se detectan automáticamente según el entorno. Si necesitas URLs personalizadas:

```bash
# REST API URL
REACT_APP_HYPERLIQUID_API_URL=https://api.hyperliquid.xyz

# WebSocket URL
REACT_APP_HYPERLIQUID_WS_URL=wss://api.hyperliquid.xyz/ws
```

### Configuración de WebSocket

```bash
# Habilitar WebSocket para datos en tiempo real
REACT_APP_ENABLE_WEBSOCKET=true

# Máximo de intentos de reconexión
REACT_APP_WS_MAX_RETRIES=10

# Delay base de reconexión (en ms)
REACT_APP_WS_RECONNECT_DELAY=1000
```

### Modo Debug

```bash
# Habilitar logs de debug (solo desarrollo)
REACT_APP_DEBUG_MODE=false
```

## Entornos Disponibles

### Mainnet (Producción)
- **REST API**: `https://api.hyperliquid.xyz`
- **WebSocket**: `wss://api.hyperliquid.xyz/ws`
- Usa fondos reales
- Trading en vivo

### Testnet (Pruebas)
- **REST API**: `https://api.hyperliquid-testnet.xyz`
- **WebSocket**: `wss://api.hyperliquid-testnet.xyz/ws`
- Fondos de prueba
- Ideal para desarrollo

## Funcionalidades WebSocket

El WebSocket de HyperLiquid proporciona datos en tiempo real:

### 1. Precios en Tiempo Real (`allMids`)
Recibe actualizaciones de precios de todos los pares disponibles.

```javascript
// Uso en hooks
const { data, isRealTime } = useCryptoPrice('bitcoin', 60000, true);
```

### 2. Order Book en Tiempo Real (`l2Book`)
Actualizaciones del libro de órdenes con bids y asks.

```javascript
const { orderBook, isRealTime } = useOrderBook('btc', 30000, true);
```

### 3. Trades Recientes (`trades`)
Stream de trades ejecutados en tiempo real.

```javascript
const { trades, isRealTime } = useRecentTrades('btc', 10000, true);
```

### 4. Eventos de Usuario (`user`)
Notificaciones de fills, órdenes y cambios de posición del usuario conectado.

```javascript
const ws = useHyperliquidWebSocket();
ws.subscribeUserEvents(userAddress, (events) => {
  console.log('User events:', events);
});
```

### 5. Velas/Candles (`candle`)
Stream de velas para gráficos en tiempo real.

```javascript
ws.subscribeCandles('BTC', '1m', (candle) => {
  console.log('New candle:', candle);
});
```

## Ventajas del WebSocket

### ✅ Con WebSocket (Tiempo Real)
- Actualizaciones instantáneas de precios
- Order book actualizado en milisegundos
- Trades mostrados al instante
- Menor latencia
- Menor carga en el servidor

### ❌ Sin WebSocket (Polling REST)
- Actualización cada 10-60 segundos
- Mayor consumo de ancho de banda
- Mayor latencia
- Datos menos precisos

## Ejemplo de Configuración Completa

### Para Desarrollo (Testnet)

```bash
# .env
REACT_APP_HYPERLIQUID_ENV=testnet
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENABLE_WEBSOCKET=true
REACT_APP_DEBUG_MODE=true
```

### Para Producción (Mainnet)

```bash
# .env
REACT_APP_HYPERLIQUID_ENV=mainnet
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENABLE_WEBSOCKET=true
REACT_APP_DEBUG_MODE=false
```

## Monitoreo de Conexión

El contexto de trading proporciona información sobre el estado del WebSocket:

```javascript
import { useTradingData } from './context/HyperliquidTradingProvider';

function TradingComponent() {
  const { realTime, websocket } = useTradingData();
  
  return (
    <div>
      {/* Indicador de conexión WebSocket */}
      <div>
        WebSocket: {websocket.isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
      </div>
      
      {/* Indicador de datos en tiempo real */}
      <div>
        Order Book: {realTime.orderBook ? '⚡ Real-time' : '🔄 Polling'}
        Trades: {realTime.trades ? '⚡ Real-time' : '🔄 Polling'}
        Prices: {realTime.price ? '⚡ Real-time' : '🔄 Polling'}
      </div>
    </div>
  );
}
```

## Solución de Problemas

### WebSocket no se conecta

1. **Verifica las variables de entorno**
   ```bash
   echo $REACT_APP_HYPERLIQUID_ENV
   ```

2. **Revisa la consola del navegador**
   - Busca mensajes `[HyperliquidWS]`
   - Verifica errores de conexión

3. **Verifica la URL del WebSocket**
   - Debe ser `wss://` no `ws://`
   - No debe tener barra final `/`

### Reconexión automática

El cliente WebSocket incluye reconexión automática con:
- Backoff exponencial (1s, 2s, 4s, 8s...)
- Máximo 10 intentos por defecto
- Heartbeat cada 30 segundos
- Re-suscripción automática a canales

### Performance

Si experimentas lag o actualizaciones lentas:

1. **Reduce el número de suscripciones activas**
2. **Aumenta el throttle de actualizaciones**
3. **Verifica tu conexión a internet**
4. **Considera usar REST API si WebSocket es inestable**

## API Reference

### Hook: `useHyperliquidWebSocket`

```javascript
const ws = useHyperliquidWebSocket({
  autoConnect: true,  // Conectar automáticamente
  log: false,         // Habilitar logs de debug
});

// Métodos disponibles
ws.connect()
ws.disconnect()
ws.subscribeAllMids(callback)
ws.subscribeTrades(coin, callback)
ws.subscribeOrderBook(coin, callback)
ws.subscribeCandles(coin, interval, callback)
ws.subscribeUserEvents(user, callback)
```

### Clase: `HyperliquidWSClient`

```javascript
import { HyperliquidWSClient } from './hyperliquid/wsClient';

const client = new HyperliquidWSClient({
  onTrade: (trade) => console.log(trade),
  onOrderBook: (book) => console.log(book),
  onAllMids: (mids) => console.log(mids),
  onError: (error) => console.error(error),
  log: true
});

client.connect();
client.subscribe({ type: 'trades', coin: 'BTC' });
```

## Documentación Oficial

- [HyperLiquid API Docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api)
- [WebSocket Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket)
- [REST API Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint)

## Soporte

Para problemas relacionados con la API de HyperLiquid:
- Discord oficial de HyperLiquid
- GitHub Issues del proyecto

Para problemas de integración:
- Revisa los logs en consola con `REACT_APP_DEBUG_MODE=true`
- Consulta este documento

