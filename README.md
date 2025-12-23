 template-Boltz - https://template-boltz-dev.vercel.app/login

# Frontend Fund8 V3
#Version 2.1
 
Plataforma de trading de criptomonedas integrada con HyperLiquid.
 
## 🚀 Inicio Rápido 
  
### Requisitos
- Node.js >= 18.17.0 y < 23
- npm >= 9

### Instalación

```bash 
# Instalar dependencias
npm install

# Crear archivo de configuración
cp HYPERLIQUID_CONFIG.md .env
# Edita .env con tu configuración

# Iniciar en desarrollo
npm start
```

### Scripts Disponibles

- `npm start` - Inicia servidor de desarrollo
- `npm run build` - Compila para producción
- `npm test` - Ejecuta tests
- `npm run sass` - Compila SASS en modo watch

## 🔌 Integración HyperLiquid

Este proyecto incluye integración completa con HyperLiquid API:

### ✅ Implementado
- ✅ REST API completa (precios, orderbook, trades, user data)
- ✅ **WebSocket en tiempo real** (precios, orderbook, trades en vivo)
- ✅ Trading (place/cancel orders con firma de wallet)
- ✅ Gestión de posiciones y balances
- ✅ Historial de transacciones
- ✅ Hooks personalizados para React

### 📡 WebSocket en Tiempo Real

El proyecto ahora soporta datos en tiempo real vía WebSocket:
- Precios actualizados al instante
- Order book con actualizaciones en milisegundos
- Trades ejecutados en vivo
- Eventos de usuario (fills, órdenes)

Ver [HYPERLIQUID_CONFIG.md](./HYPERLIQUID_CONFIG.md) para configuración detallada.

### Configuración Rápida

```bash
# .env
REACT_APP_HYPERLIQUID_ENV=mainnet
REACT_APP_ENABLE_WEBSOCKET=true
```

## 📚 Documentación

- [Configuración de HyperLiquid](./HYPERLIQUID_CONFIG.md)
- [HyperLiquid API Docs](https://hyperliquid.gitbook.io/hyperliquid-docs)

## 🛠️ Tecnologías

- React 18
- Redux Toolkit
- ethers.js (Web3)
- HyperLiquid API + WebSocket
- Bootstrap
- ApexCharts / Chart.js
- SASS
 
