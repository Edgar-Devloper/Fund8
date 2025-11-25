# 🔧 Solución de Problemas WebSocket

## 🚨 Errores Comunes y Soluciones

### Error: "Connection closed. Code: 1006"

**Síntoma**: WebSocket se conecta pero se cierra inmediatamente con código 1006

**Causas posibles**:
1. **Firewall o Proxy** bloqueando WebSocket
2. **CORS issues** (menos común con WSS)
3. **Formato de suscripción incorrecto**
4. **Demasiadas suscripciones simultáneas**

**Soluciones aplicadas**:
- ✅ Delay entre suscripciones (100ms cada una)
- ✅ Delay inicial antes de suscribir (100ms después de conectar)
- ✅ Límite de reconexión reducido a 5 intentos
- ✅ Delay de reconexión aumentado a 2 segundos

---

### Error: "Max reconnection attempts reached"

**Síntoma**: Después de varios intentos, el WebSocket se rinde

**Solución**:
1. **Refresca la página** (F5)
2. Si persiste, verifica tu **conexión a internet**
3. Prueba con **testnet** primero:
   ```bash
   # En .env
   REACT_APP_HYPERLIQUID_ENV=testnet
   REACT_APP_HYPERLIQUID_WS_URL=wss://api.hyperliquid-testnet.xyz/ws
   ```

---

### Error: "Response: undefined"

**Síntoma**: Las peticiones REST API devuelven `undefined`

**Causa**: El servidor no está respondiendo con datos o el formato es incorrecto

**Verificación**:
1. Abre Network tab (F12 → Network)
2. Filtra por `api.hyperliquid`
3. Verifica que las respuestas tengan contenido

**Solución temporal**: La app usará polling REST si WebSocket falla

---

## 🔍 Verificación Paso a Paso

### 1. Verificar Conectividad Básica

Abre la consola del navegador y ejecuta:

```javascript
// Test básico de conectividad WebSocket
const ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
ws.onopen = () => console.log('✅ WebSocket puede conectar');
ws.onerror = (err) => console.error('❌ Error:', err);
ws.onclose = (e) => console.log('Cerrado:', e.code, e.reason);

// Después de 5 segundos, cerrar
setTimeout(() => ws.close(), 5000);
```

**Resultado esperado**: `✅ WebSocket puede conectar`

**Si falla**: Problema de red o firewall

---

### 2. Verificar Variables de Entorno

En la consola:

```javascript
console.log('ENV:', process.env.REACT_APP_HYPERLIQUID_ENV);
console.log('WS URL:', process.env.REACT_APP_HYPERLIQUID_WS_URL);
console.log('WS Enabled:', process.env.REACT_APP_ENABLE_WEBSOCKET);
```

**Debe mostrar**:
```
ENV: mainnet (o testnet)
WS URL: wss://api.hyperliquid.xyz/ws (o undefined si usa auto-detect)
WS Enabled: true (o undefined, ambos funcionan)
```

---

### 3. Verificar Estado de Conexión en la App

```javascript
// En la consola del navegador, en la página de trading
// Esto solo funciona si estás usando HyperliquidTradingProvider
const checkWS = () => {
  console.log('Buscando estado WebSocket...');
  // El estado debe estar en React DevTools
};
checkWS();
```

---

## 🛠️ Componente de Debug

He creado un componente `WebSocketDebug` que muestra información en tiempo real.

### Cómo usarlo:

```javascript
// En tu página de trading (ejemplo: src/jsx/pages/Trading.js)
import WebSocketDebug from '../components/trading/WebSocketDebug';

function TradingPage() {
  return (
    <div>
      {/* Tu contenido */}
      
      {/* Agregar al final */}
      {process.env.NODE_ENV === 'development' && <WebSocketDebug />}
    </div>
  );
}
```

**Muestra**:
- 🟢 Estado de conexión
- ⚡ Qué datos son real-time
- 🔄 Qué datos usan REST

---

## 🚀 Pasos para Resolver tu Error Actual

### Paso 1: Limpiar caché y refrescar

```bash
# 1. Detén el servidor (Ctrl+C)

# 2. Limpia caché de npm
npm cache clean --force

# 3. Limpia node_modules (opcional pero recomendado)
rm -rf node_modules
npm install

# 4. Reinicia
npm start
```

### Paso 2: Verificar en el navegador

1. **Borra caché del navegador**: `Ctrl + Shift + Del`
2. **Refresca hard**: `Ctrl + Shift + R`
3. **Abre la consola**: `F12`

### Paso 3: Revisar logs en orden

Deberías ver:

```
[Hyperliquid API] Environment: mainnet
[Hyperliquid API] Base URL: https://api.hyperliquid.xyz
[HyperliquidWS] Connecting to wss://api.hyperliquid.xyz/ws...
[HyperliquidWS] Connected successfully
[HyperliquidWS] Resubscribing to all channels...
[HyperliquidWS] Subscribing: {type: "allMids"}
```

### Paso 4: Si sigue fallando - Usar solo REST API

Si WebSocket no funciona en tu red, desactívalo temporalmente:

```bash
# En .env
REACT_APP_ENABLE_WEBSOCKET=false
```

La app seguirá funcionando con polling REST API (actualiza cada 10-60s en lugar de tiempo real).

---

## 🌐 Problemas de Red Conocidos

### Corporate Firewalls

Algunos firewalls corporativos bloquean WebSocket (WSS).

**Solución**:
1. Pedir a IT que permita `wss://api.hyperliquid.xyz`
2. Usar VPN
3. Trabajar con REST API solamente

### Antivirus / Firewall Local

Algunos antivirus bloquean WebSocket.

**Solución**:
1. Agregar excepción para `localhost:3000` y `api.hyperliquid.xyz`
2. Desactivar temporalmente para probar

### Proxy / VPN

Algunos proxies no soportan WebSocket.

**Solución**:
1. Desactivar proxy temporalmente
2. Configurar proxy para permitir WebSocket

---

## 📊 Logs de Debug Mejorados

Con los cambios aplicados, ahora verás:

```
[Hyperliquid API] Response: l2Book ✓       (Datos OK)
[Hyperliquid API] Response: trades ✗       (Sin datos)
```

En lugar de solo:
```
[Hyperliquid API] Response: undefined
```

Esto ayuda a identificar qué endpoints están funcionando.

---

## 🔄 Comparación: Con y Sin WebSocket

### Con WebSocket Funcionando ✅
- Precios actualizan **< 100ms**
- Order book cambia **instantáneamente**
- Trades aparecen **en vivo**
- **Menor** consumo de datos
- **Mejor** experiencia de usuario

### Sin WebSocket (REST Only) 📡
- Precios actualizan **cada 60s**
- Order book actualiza **cada 30s**
- Trades actualizan **cada 10s**
- **Mayor** consumo de datos (polling)
- Experiencia **aceptable** pero no ideal

**Ambos modos funcionan** - WebSocket es solo una mejora de performance.

---

## 🧪 Test Manual

Ejecuta esto en la consola para testear manualmente:

```javascript
// Test de WebSocket manual
const testWS = () => {
  const ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
  
  ws.onopen = () => {
    console.log('✅ Conectado');
    // Suscribirse a precios
    ws.send(JSON.stringify({
      method: 'subscribe',
      subscription: { type: 'allMids' }
    }));
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('📨 Mensaje:', data.channel, data.data ? '✓' : '✗');
  };
  
  ws.onerror = (err) => {
    console.error('❌ Error:', err);
  };
  
  ws.onclose = (e) => {
    console.log('🔴 Cerrado:', e.code, e.reason);
  };
  
  // Cerrar después de 10 segundos
  setTimeout(() => {
    console.log('Cerrando test...');
    ws.close();
  }, 10000);
};

testWS();
```

**Resultado esperado**:
```
✅ Conectado
📨 Mensaje: allMids ✓
📨 Mensaje: allMids ✓
...
```

---

## 📞 Siguiente Paso

1. **Refresca el navegador** (`Ctrl + Shift + R`)
2. **Ve a la página de trading** (`/trading`)
3. **Abre la consola** (F12)
4. **Copia y pega aquí** los primeros 20 mensajes que veas

Esto me ayudará a identificar el problema exacto.

---

## 💡 Tip: Network Tab

Para ver los mensajes WebSocket en detalle:

1. F12 → **Network** tab
2. Filtrar por **WS** (WebSockets)
3. Click en la conexión `api.hyperliquid.xyz`
4. Tab **Messages**
5. Verás todos los mensajes entrando/saliendo

---

¿Qué ves ahora en la consola después de refrescar?

