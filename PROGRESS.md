# PROGRESS – Trader Panel

> Método: suma ponderada de módulos con estado >= Integrado.

## Metodología
Estados:
- No iniciado
- Estructura (carpetas / placeholders)
- Mock (datos falsos conectados)
- Integrado (datos reales básicos)
- Completo (edge cases + pruebas + refinamiento UX)

Fórmula de avance (%): `Σ (peso módulo) donde estado ∈ {Integrado, Completo}`.

## Tabla de Módulos
| Módulo | Estado | Peso % | Notas |
|--------|--------|-------:|-------|
| Trading Screen | No iniciado | 12 | |
| Market Watch | No iniciado | 8 | |
| OrderBook | No iniciado | 5 | |
| OrderForm | No iniciado | 5 | |
| Orders (Open) | No iniciado | 6 | |
| Order History | No iniciado | 6 | |
| Dashboard | Mock | 6 | Usa componentes del template | 
| Portfolio | Mock | 6 | Basado en Portofolio.js |
| WebSocket Infra | No iniciado | 8 | |
| Auth/Base Security | Estructura | 6 | Pantallas Login/Registro existentes |
| Alerts | No iniciado | 5 | |
| API Keys | No iniciado | 5 | |
| Reports | No iniciado | 4 | |
| Transfers | No iniciado | 4 | |
| Risk | No iniciado | 5 | |
| Compliance/KYC | No iniciado | 4 | |
| Auditoría | No iniciado | 3 | |
| Admin | No iniciado | 2 | |
| Branding Base | Completo | 0 | No pondera (informativo) |

Total ponderado = 100%

## Cálculo Inicial
Avance = Dashboard (Mock no cuenta) + Portfolio (Mock no cuenta) + Auth (Estructura no cuenta) = 0%  
Avance mostrado actual: **0%** (se contabiliza a partir de Integrado).

## Próximos Hitos
1. Crear `useWebSocket` (estado → Estructura) → no suma.
2. Integrar primer feed de ticker (WebSocket Infra → Integrado) = +8%.
3. Integrar OrderBook básico = +5% (13%).
4. Integrar OrderForm (envío de orden simulado) = +5% (18%).
5. Integrar Orders (Open) lectura = +6% (24%).

## Notas de Control
- Actualizar esta tabla con cada PR relevante.
- Cuando un módulo pasa a Integrado → recalcular avance.
- Añadir columna “Owner” si se suma equipo.
