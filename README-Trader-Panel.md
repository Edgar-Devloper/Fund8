// README anterior reemplazado para alinearlo con la arquitectura aprobada de Trader Panel.
# Trader Panel – Documentación Principal

> Versión: 0.1.0  
> Estado: Planificación estructurada (fundación del panel en marcha)

## 1. Visión
Plataforma interna modular para visualización y operación de trading, con foco en:
- Observabilidad de mercado (precios, profundidad, trades).
- Gestión y monitoreo de órdenes y balances.
- Seguridad (roles, logs, auditoría, API keys, 2FA futura).
- Extensibilidad (nuevas fuentes de datos, nuevos tipos de órdenes, métricas de riesgo).

## 2. Objetivos Iniciales (MVP)
1. Dashboard con KPIs principales (volumen, PnL simulado, órdenes activas, balances).  
2. Market Watch (lista de instrumentos / pares).  
3. Módulo Trading integrado (gráfico + orderbook + últimos trades + formulario de orden).  
4. Órdenes Activas + Historial de Órdenes.  
5. Portafolio / Balances.  
6. Hooks para WebSocket + fallback polling.  
7. Autenticación base y estructura para autorización por rol (si aplica).  

## 3. Roadmap por Fases
### Fase 1 (MVP Operativo)
- Dashboard
- Market Watch
- Trading Screen
- Open Orders / Order History
- Portfolio / Balances
- OrderForm (Limit / Market)
- WebSocket base (suscripción a ticker / orderbook / trades)

### Fase 2
- Transferencias (depósitos / retiros / movimientos internos)
- Alertas (reglas precio / volumen)
- API Keys Management
- Reportes (CSV/PDF básico)
- Mejoras UX tablas (filtros avanzados, export)

### Fase 3
- Riesgo / Exposure (posición neta, concentración, PnL detallado)
- Compliance / KYC
- Auditoría / Logs
- Panel Admin (gestión usuarios / límites)
- Optimización performance (code splitting, memoization, lazy modules)

### Fase 4 (Escalamiento / Madurez)
- Tipos de orden avanzados (Stop, Stop-Limit, OCO)
- Multi‑tenancy / multi‑role
- Integración con proveedores externos / agregadores
- Health & Latency Monitor (panel técnico)
- Sistema de permisos granular

## 4. Estructura de Carpetas (Propuesta Evolutiva)
```
src/
	context/                # Contextos globales (tema, auth, sockets)
	images/                 # Activos estáticos internos
	jsx/
		layouts/              # Layout y shell de la app
		pages/                # Páginas (routing level)
			Dashboard/
			Market/
			Trading/
			Orders/
			OrderHistory/
			Portfolio/
			AssetDetail/
			Transfers/
			Risk/
			Alerts/
			Reports/
			ApiKeys/
			Settings/
			Compliance/
			Admin/
		components/
			trading/
				OrderForm/
				OrderBook/
				TradesTicker/
				PriceTicker/
				PairSelector/
				ChartWrapper/
			portfolio/
				BalanceTable/
				AllocationPie/
			orders/
				OrdersTable/
				OrderFilters/
			alerts/
				AlertRuleForm/
				AlertList/
			api/
				ApiKeyTable/
				ApiKeyForm/
			common/
				Table/
				Modal/
				Tooltip/
				Loader/
				SearchInput/
				Pagination/
				EmptyState/
				ErrorBoundary/
			hooks/
				useWebSocket.js
				useAuth.js
				usePolling.js
				useFeatureFlags.js
			utils/
				formatters.js
				math.js
				logger.js
	services/               # Llamadas API centralizadas
	store/                  # Redux slices (si se mantiene) / Zustand futuro
	scss/                   # Estilos globales + variables
```

## 5. Estándares de Código
- Componentes funcionales + hooks, evitar clases nuevas.
- Nombres de archivo `PascalCase` para componentes, `camelCase` para hooks y utilidades.
- Un componente = una responsabilidad clara (SRP).
- Evitar lógica de datos directamente en componentes de presentación (crear hooks o servicios).
- Tipado: (Pendiente) → evaluar migración a TypeScript en versión >=0.3.0.
- Import sorting: externos → internos → estilos.

## 6. Convenciones de Estado
- Estado de sesión y usuario: `AuthContext` o slice dedicado.
- Estado de mercado en tiempo real: canal WebSocket + normalización en store (por símbolo).
- Formularios: estado local controlado + validaciones ligeras (yup / zod futuro si se añade).

## 7. WebSocket & Fallback
`useWebSocket(url, { topics })` (propuesta):
- Auto‑reconnect exponencial.
- Heartbeat (ping/pong) si el backend lo soporta.
- Callback o dispatcher hacia store según `message.type`.
Fallback: `usePolling(endpoint, intervalMs)` para métricas lentas (balances cada X seg).

## 8. Seguridad (Base y Futuro)
| Capa | Actual | Futuro |
|------|--------|--------|
| Autenticación | Login existente | Refresh tokens / Rotación |
| Autorización | Simplificada | Roles + permisos por recurso |
| Auditoría | No aún | Log estructurado de acciones sensibles |
| API Keys | No | Creación, revocación, scopes |
| 2FA | No | TOTP / WebAuthn |
| Protección CSRF | No aplica (SPA con tokens) | Revisar si se usan cookies |
| Rate limiting | Backend | Mostrar límites UI |

Check de dependencias: `npm audit` + actualización selectiva (ya iniciada). Añadir script en futuro: `npm run audit:ci`.

## 9. Métrica de Progreso
Archivo `PROGRESS.md` (ver sección asociada) con columnas:
```
| Módulo | Estado | Peso % | Avance % acumulado |
```
Estados válidos: `No iniciado`, `Estructura`, `Mock`, `Integrado`, `Completo`.
Fórmula: Suma pesos de módulos con estado >= `Integrado`.

Pesos iniciales (sugerencia):
- Trading Screen 12%
- Market Watch 8%
- OrderBook 5%
- OrderForm 5%
- Orders (Open) 6%
- Order History 6%
- Dashboard 6%
- Portfolio 6%
- WebSocket Infra 8%
- Auth/Base Security 6%
- Alerts 5%
- API Keys 5%
- Reports 4%
- Transfers 4%
- Risk 5%
- Compliance/KYC 4%
- Auditoría 3%
- Admin 2%

Total = 100%

## 10. CHANGELOG
Formato: [Keep a Changelog](https://keepachangelog.com/) + SemVer.
Primera entrada (0.1.0): planificación, branding inicial (logos), definición de arquitectura y roadmap.

## 11. Flujo de Trabajo Sugerido
1. Crear rama feature (`feat/market-watch-table`).
2. Implementar componente aislado con datos mock.
3. Añadir test básico (cuando se agregue framework de pruebas a medir render/props).
4. Integrar con servicios reales.
5. Actualizar `PROGRESS.md` y `CHANGELOG.md`.
6. Pull Request (revisión rápida: lint, estructura, naming, impacto bundle si procede).

## 12. Servicios / API (Placeholder)
Definir interfaz antes de implementar:
```
// Ejemplo shape order
{
	id: string,
	symbol: string,
	side: 'buy' | 'sell',
	type: 'limit' | 'market',
	price?: number,
	quantity: number,
	filled: number,
	status: 'new' | 'partially_filled' | 'filled' | 'canceled',
	createdAt: string,
	updatedAt: string
}
```
Normalizar símbolos a MAYÚSCULAS (`BTC-USD`).

## 13. Rendimiento y Optimización (Futuro)
- Lazy load de páginas no críticas.
- Memoization en tablas grandes y orderbook (windowing si necesario).
- WebSocket batch + flush cada frame (requestAnimationFrame) para evitar re-render tormentoso.
- Reemplazar librerías pesadas si el bundle supera umbral (~300KB gzip inicial).

## 14. Accesibilidad / UX
- Roles aria en tablas y botones icónicos.
- Foco gestionado tras apertura de modales.
- Colores con contraste mínimo WCAG AA (validar charts y badges).

## 15. Internacionalización (Opcional Futuro)
Infra básica: wrapper de diccionario + hook `useI18n(key)`. No crítico en 0.x.

## 16. Próximos Archivos a Crear
- `CHANGELOG.md`
- `PROGRESS.md`
- `src/jsx/components/trading/README.md` (micro docs por dominio si se necesita)

## 17. Próximos Pasos Inmediatos
1. Crear CHANGELOG inicial.
2. Crear PROGRESS con tabla vacía y marcar avance actual físico (~8%).
3. Scaffold carpetas vacías mínimas para Fase 1 (opcional en este momento). 
4. Implementar `useWebSocket` skeleton.

---

Si necesitas ajustar pesos o añadir/quitar módulos avísame antes de consolidar los otros archivos.
