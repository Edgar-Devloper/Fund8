# 🚀 Guía de Implementación WebSocket - HyperLiquid

## ✅ ¿Qué se ha implementado?

Se ha implementado una integración completa de WebSocket con HyperLiquid que proporciona:

1. **Cliente WebSocket Real** (`wsClient.js`)
   - Conexión a `wss://api.hyperliquid.xyz/ws` (mainnet) o testnet
   - Reconexión automática con backoff exponencial
   - Heartbeat (ping/pong) cada 30 segundos
   - Soporte para múltiples suscripciones

2. **Hook Personalizado** (`useHyperliquidWebSocket`)
   - Interfaz simple para usar WebSocket en componentes React
   - Gestión automática de conexión y desconexión
   - Callbacks para diferentes tipos de datos

3. **Hooks Actualizados con WebSocket**
   - `useOrderBook` - Order book en tiempo real
   - `useRecentTrades` - Trades en vivo
   - `useCryptoPrice` - Precios actualizados al instante
   - Todos con fallback a REST API si WebSocket falla

4. **Integración en Provider**
   - `HyperliquidTradingProvider` ahora usa WebSocket
   - Expone estado de conexión en tiempo real
   - Indicadores de qué datos son real-time

5. **Componente de Estado** (`WebSocketStatus`)
   - Muestra visualmente el estado de conexión
   - Indica qué datos son en tiempo real
   - Fácil de agregar a cualquier página

---

## 📋 Pasos para Usar

### 1. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Para producción (mainnet)
REACT_APP_HYPERLIQUID_ENV=mainnet
REACT_APP_ENABLE_WEBSOCKET=true

# Para desarrollo (testnet)
# REACT_APP_HYPERLIQUID_ENV=testnet
# REACT_APP_DEBUG_MODE=true
```

### 2. Ya está listo! 🎉

El WebSocket se conectará automáticamente al iniciar la aplicación. Los hooks ya existentes ahora recibirán datos en tiempo real.

### 3. (Opcional) Mostrar Estado de Conexión

Para mostrar un indicador visual del estado del WebSocket, agrega este componente en tu layout:

```javascript
// En tu archivo de layout o página principal
import WebSocketStatus from './components/trading/WebSocketStatus';

function TradingPage() {
  return (
    <div>
      {/* Tu contenido */}
      
      {/* Indicador de WebSocket (esquina superior derecha) */}
      <WebSocketStatus position="top-right" />
      
      {/* O versión compacta */}
      {/* <WebSocketStatus position="top-right" compact={true} /> */}
    </div>
  );
}
```

---

## 🔍 Verificar que Funciona

### 1. En la Consola del Navegador

Abre DevTools (F12) y busca mensajes como:

```
[Hyperliquid API] Environment: mainnet
[Hyperliquid API] Base URL: https://api.hyperliquid.xyz
[HyperliquidWS] Connecting to wss://api.hyperliquid.xyz/ws...
[HyperliquidWS] Connected successfully
[HyperliquidWS] Subscribing: {type: "allMids"}
```

### 2. En tu Componente

Puedes verificar el estado desde cualquier componente:

```javascript
import { useTradingData } from './context/HyperliquidTradingProvider';

function MyComponent() {
  const { realTime, websocket } = useTradingData();
  
  console.log('WebSocket conectado:', websocket.isConnected);
  console.log('Precios en tiempo real:', realTime.price);
  console.log('Order book en tiempo real:', realTime.orderBook);
  console.log('Trades en tiempo real:', realTime.trades);
  
  return (
    <div>
      {websocket.isConnected ? (
        <span>🟢 Datos en vivo</span>
      ) : (
        <span>🔴 Usando polling</span>
      )}
    </div>
  );
}
```

### 3. Network Tab

En DevTools → Network → WS (WebSockets), deberías ver:

- Conexión a `wss://api.hyperliquid.xyz/ws`
- Estado: `101 Switching Protocols`
- Mensajes JSON entrantes/salientes

---

## 💡 Uso Avanzado

### Suscribirse Manualmente a Canales

```javascript
import { useHyperliquidWebSocket } from './hooks/useHyperliquidWebSocket';

function CustomComponent() {
  const ws = useHyperliquidWebSocket({
    autoConnect: true,
    log: true, // Habilitar logs de debug
  });

  useEffect(() => {
    if (!ws.isConnected) return;

    // Suscribirse a todos los precios
    const unsubscribe = ws.subscribeAllMids((allMids) => {
      console.log('Precios actualizados:', allMids);
    });

    return unsubscribe; // Cleanup
  }, [ws.isConnected]);

  return <div>...</div>;
}
```

### Diferentes Tipos de Suscripciones

```javascript
// Precios de todos los pares
ws.subscribeAllMids((mids) => {
  console.log('BTC:', mids.BTC);
  console.log('ETH:', mids.ETH);
});

// Trades de un coin específico
ws.subscribeTrades('BTC', (trade) => {
  console.log('Nuevo trade:', trade.price, trade.side, trade.amount);
});

// Order book de un coin
ws.subscribeOrderBook('BTC', (book) => {
  console.log('Bids:', book.bids.length);
  console.log('Asks:', book.asks.length);
});

// Candles en tiempo real
ws.subscribeCandles('BTC', '1m', (candle) => {
  console.log('Nueva vela:', candle.close);
});

// Eventos del usuario (requiere wallet conectada)
ws.subscribeUserEvents(userAddress, (events) => {
  console.log('Fills, órdenes, etc:', events);
});
```

---

## 🐛 Solución de Problemas

### WebSocket no conecta

**Síntoma**: Mensaje "WebSocket Desconectado" permanente

**Solución**:
1. Verifica que `.env` tenga `REACT_APP_ENABLE_WEBSOCKET=true`
2. Revisa la consola para errores
3. Asegúrate de que la URL del WebSocket es correcta
4. Prueba con testnet primero

```bash
# Forzar testnet
REACT_APP_HYPERLIQUID_ENV=testnet
```

### Datos no se actualizan

**Síntoma**: El componente muestra datos estáticos

**Solución**:
1. Verifica que `isRealTime` sea `true`:
   ```javascript
   const { trades, isRealTime } = useRecentTrades('btc');
   console.log('Real-time?', isRealTime);
   ```
2. Verifica que el hook reciba el parámetro `useWebSocket = true`
3. Revisa en Network tab si llegan mensajes WebSocket

### Reconexión constante

**Síntoma**: WebSocket se conecta y desconecta repetidamente

**Solución**:
1. Revisa que no haya errores de autenticación (si aplica)
2. Verifica tu conexión a internet
3. Aumenta el delay de reconexión:
   ```bash
   REACT_APP_WS_RECONNECT_DELAY=5000
   ```

### Performance lento

**Síntoma**: Lag o pantalla congelada con WebSocket

**Solución**:
1. Reduce el número de suscripciones activas
2. Implementa throttling en callbacks:
   ```javascript
   const throttledCallback = useCallback(
     throttle((data) => {
       // Procesar datos
     }, 100), // Max 10 actualizaciones por segundo
     []
   );
   ```

---

## 📊 Comparación: REST vs WebSocket

| Característica | REST (Polling) | WebSocket (Real-time) |
|----------------|----------------|------------------------|
| **Latencia** | 10-60 segundos | < 100ms |
| **Ancho de banda** | Alto (requests repetidos) | Bajo (conexión persistente) |
| **Precisión** | Media | Alta |
| **Order Book** | Snapshot cada 30s | Actualizaciones continuas |
| **Trades** | Cada 10s | Instantáneos |
| **Precios** | Cada 1 min | Instantáneos |
| **Carga servidor** | Alta | Baja |

---

## 🎯 Próximos Pasos Recomendados

Una vez que el WebSocket funcione correctamente:

1. **Implementar user subscriptions**
   - Notificaciones de fills en tiempo real
   - Actualizaciones de balance automáticas
   - Alertas de órdenes ejecutadas

2. **Agregar gráficos de velas en tiempo real**
   - Usar `subscribeCandles` para actualizar charts
   - Implementar diferentes timeframes

3. **Dashboard de métricas**
   - Volumen en tiempo real
   - Open Interest
   - Funding rates actualizados

4. **Alertas de precio**
   - Sistema de notificaciones cuando precio alcanza target
   - Alertas de cambios significativos

5. **Order book heatmap**
   - Visualización de liquidez en tiempo real
   - Detección de walls

---

## 📚 Recursos

- [Documentación HyperLiquid WebSocket](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket)
- [HYPERLIQUID_CONFIG.md](./HYPERLIQUID_CONFIG.md) - Configuración detallada
- [README.md](./README.md) - Información general del proyecto

---

## 🆘 Soporte

Si encuentras problemas:

1. Habilita debug mode:
   ```bash
   REACT_APP_DEBUG_MODE=true
   ```

2. Revisa los logs en consola

3. Verifica en Network tab (WebSocket messages)

4. Consulta la documentación oficial de HyperLiquid

---

## ✨ Características Implementadas

- ✅ Conexión WebSocket automática
- ✅ Reconexión con backoff exponencial
- ✅ Heartbeat (ping/pong)
- ✅ Múltiples suscripciones simultáneas
- ✅ Fallback automático a REST API
- ✅ Hooks con soporte WebSocket
- ✅ Provider con estado real-time
- ✅ Componente de estado visual
- ✅ Configuración por variables de entorno
- ✅ Soporte mainnet y testnet
- ✅ TypeScript declarations ready
- ✅ Error handling robusto
- ✅ Memory leak prevention

---

**¡El WebSocket está listo para usar! 🚀**

Simplemente inicia tu aplicación con `npm start` y los datos comenzarán a fluir en tiempo real.

