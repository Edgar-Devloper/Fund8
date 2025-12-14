import React, { useState, useMemo, useEffect } from 'react';
import PairSelector from '../PairSelector';
import PriceTicker from '../PriceTicker';
import { useTradingData } from '../context/HyperliquidTradingProvider';
import { hasLocalIcon } from '../../../../utils/coinIcons';

/**
 * PairsModal
 * Modal avanzado para selección de par, vista de ticker y exploración de exchanges soportados.
 * Accesible (Escape cierra, focus trap simple) y adaptable a ThemeContext via atributos de body.
 */
const tabs = [
  { id: 'spot', label: 'Spot' },
  { id: 'futures', label: 'Futuros' },
  { id: 'favorites', label: 'Favoritos' },
  { id: 'exchanges', label: 'Exchanges' },
];

const statusBadge = (s) => {
  const map = { live: 'success', dev: 'info', soon: 'secondary' };
  return map[s] || 'secondary';
};

export default function PairsModal({ onClose }) {
  const [active, setActive] = useState('spot');
  const { exchange, setExchange, exchanges } = useTradingData();

  // Focus inicial al abrir
  const firstBtnRef = React.useRef(null);
  useEffect(() => { firstBtnRef.current && firstBtnRef.current.focus(); }, []);

  // Esc para cerrar (por si no lo maneja padre)
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // Tema derivado de body attributes
  // Dependencias: leemos atributos y los memorizamos (evitar expresión compleja en deps)
  const themeVersion = document.body.getAttribute('data-theme-version');
  const themePrimary = document.body.getAttribute('data-primary');
  const theme = useMemo(() => ({
    version: themeVersion || 'light',
    primary: themePrimary || 'color_1'
  }), [themeVersion, themePrimary]);

  const isDark = theme.version === 'dark';
  const glassBg = isDark ? 'rgba(17,25,40,0.82)' : 'rgba(255,255,255,0.82)';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const headerGrad = isDark
    ? 'linear-gradient(90deg,rgba(255,255,255,0.05),rgba(255,255,255,0))'
    : 'linear-gradient(90deg,rgba(0,0,0,0.04),rgba(0,0,0,0))';

  return (
    <div role="dialog" aria-modal="true" aria-label="Selector de Pares" style={{position:'fixed', inset:0, zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div onClick={onClose} style={{position:'absolute', inset:0, background:isDark?'rgba(10,15,25,.85)':'rgba(240,245,255,.65)', backdropFilter:'blur(7px) saturate(160%)'}} />
      <div style={{position:'relative', width:'min(1000px,95%)', maxHeight:'82vh', background:glassBg, border:'1px solid '+borderColor, borderRadius:'22px', boxShadow:isDark?'0 10px 50px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset':'0 10px 40px -8px rgba(0,0,0,0.20),0 0 0 1px rgba(0,0,0,0.03) inset', overflow:'hidden', display:'flex', flexDirection:'column', animation:'modalIn .32s cubic-bezier(.4,.14,.3,1)'}}>
        <div className="d-flex align-items-center gap-3 px-4" style={{minHeight:64, background:headerGrad}}>
          <h6 className="mb-0 fw-semibold" style={{letterSpacing:'.5px'}}>Pares & Precio</h6>
          <ul className="nav nav-pills small ms-3" style={{gap:'6px'}}>
            {tabs.map(t => (
              <li key={t.id} className="nav-item">
                <button ref={t.id==='spot'?firstBtnRef:undefined} className={`nav-link py-1 px-3 ${active===t.id?'active':''}`} style={{borderRadius:20}} onClick={() => setActive(t.id)}>{t.label}</button>
              </li>
            ))}
          </ul>
          <div className="ms-auto d-flex gap-2">
            <button className="btn btn-sm btn-outline-light" style={{borderRadius:30}} onClick={onClose}>Cerrar</button>
          </div>
        </div>
        <div className="flex-grow-1 px-4 py-4" style={{overflowY:'auto'}}>
          {active === 'spot' && (
            <div className="row g-4">
              <div className="col-12 col-md-7">
                <SectionTitle title="Mercados Spot" hint="Ctrl+K buscar (próximo)" />
                <GlassPanel maxHeight="48vh">
                  <PairSelector />
                </GlassPanel>
              </div>
              <div className="col-12 col-md-5 d-flex flex-column">
                <SectionTitle title="Ticker" />
                <div className="card flex-grow-1 rounded-4" style={{background:isDark?'linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))':'linear-gradient(145deg,rgba(0,0,0,0.04),rgba(0,0,0,0.01))', border:'1px solid '+borderColor}}>
                  <div className="card-body p-3 d-flex flex-column gap-3">
                    <PriceTicker />
                    <div className="text-muted small" style={{lineHeight:1.4}}>Selecciona un par para actualizar el gráfico principal. Próximo: favoritos, filtros avanzados y búsqueda.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {active === 'futures' && (
            <FuturesMarketList />
          )}
          {active === 'favorites' && (
            <div>
              <SectionTitle title="Favoritos" />
              <GlassPanel maxHeight="55vh">
                <div className="small text-muted">Aún no tienes favoritos. Pronto podrás marcar pares con ⭐ y filtrarlos aquí.</div>
              </GlassPanel>
            </div>
          )}
          {active === 'exchanges' && (
            <div>
              <SectionTitle title="Exchanges Soportados" hint="Selecciona fuente" />
              <div className="row g-3">
                {exchanges.map(ex => (
                  <div key={ex.id} className="col-12 col-sm-6 col-lg-4">
                    <button onClick={() => setExchange(ex.id)} className={`w-100 text-start rounded-4 p-3 border position-relative ${exchange===ex.id?'bg-primary text-white':'bg-transparent'}`} style={{border:'1px solid '+(exchange===ex.id? 'var(--bs-primary)':'rgba(255,255,255,0.15)')}}>
                      <div className="d-flex align-items-center mb-1">
                        <strong>{ex.name}</strong>
                        <span className={`badge bg-${statusBadge(ex.status)} ms-2`} style={{textTransform:'capitalize'}}>{ex.status}</span>
                      </div>
                      <div className="small" style={{opacity:.85}}>{ex.id === 'mock' ? 'Datos simulados para desarrollo' : ex.id==='hyperliquid' ? 'Perps + Spot (en integración)' : 'Próxima integración'}</div>
                    </button>
                  </div>
                ))}
              </div>
              <hr className="my-4" />
              <p className="small text-muted mb-0">Cambiar de exchange afecta los pares disponibles y la fuente de precios. Mientras Hyperliquid se integra, se muestran valores mock transitorios.</p>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes modalIn{0%{opacity:0;transform:translateY(14px) scale(.97)}100%{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </div>
  );
}

function SectionTitle({ title, hint }) {
  return (
    <div className="d-flex align-items-center mb-2">
      <div className="small text-uppercase text-muted fw-semibold">{title}</div>
      {hint && <div className="ms-auto small text-muted" style={{opacity:.6}}>{hint}</div>}
    </div>
  );
}

function GlassPanel({ children, maxHeight='60vh' }) {
  return (
    <div className="position-relative rounded-4" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', backdropFilter:'blur(4px)'}}>
      <div className="p-2" style={{maxHeight, overflowY:'auto'}}>
        {children}
      </div>
    </div>
  );
}

// Componente para la lista de futuros
function FuturesMarketList() {
  const { tickers, selectedSymbol, setSelectedSymbol } = useTradingData();
  const [filter, setFilter] = useState('all');
  const isDark = document.body.getAttribute('data-theme-version') === 'dark';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  // Filtrar tickers que tienen iconos locales (incluyendo los nuevos tokens)
  // Lista de tokens permitidos sin icono local
  const allowedTokensWithoutIcon = [
    'HL', 'HYPE', 'ASTER', 'PEPE', 'FLOKI', 'ZEC', 'BONK',
    'KBONK', 'KPEPE', 'KFLOKI', 'KDOGS', 'KLUNC', 'KNEIRO', 'KSHIB'
  ];
  
  const availableTickers = tickers.filter(t => {
    const symbol = t.symbol.split('/')[0];
    return hasLocalIcon(symbol) || allowedTokensWithoutIcon.includes(symbol);
  });

  const formatVolume = (vol) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(2)}K`;
    return vol.toFixed(2);
  };

  const formatFundingRate = (rate) => {
    if (!rate) return '0.0000%';
    return `${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(4)}%`;
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <SectionTitle title="Mercados Futuros" />
        <div className="d-flex gap-2">
          {['all', 'new', 'pre-launch'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ borderRadius: '20px', fontSize: '12px', padding: '4px 12px' }}
            >
              {f === 'all' ? 'All markets' : f === 'new' ? 'New' : 'Pre-launch'}
            </button>
          ))}
        </div>
      </div>
      <GlassPanel maxHeight="55vh">
        <div className="table-responsive">
          <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                <th style={{ padding: '12px', fontWeight: 600, color: isDark ? '#a0aec0' : '#333' }}>SYMBOLS / VOLUME</th>
                <th style={{ padding: '12px', fontWeight: 600, color: isDark ? '#a0aec0' : '#333', textAlign: 'right' }}>LAST PRICE</th>
                <th style={{ padding: '12px', fontWeight: 600, color: isDark ? '#a0aec0' : '#333', textAlign: 'right' }}>24H CHANGE</th>
                <th style={{ padding: '12px', fontWeight: 600, color: isDark ? '#a0aec0' : '#333', textAlign: 'right' }}>FUNDING RATE</th>
              </tr>
            </thead>
            <tbody>
              {availableTickers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                availableTickers.map((ticker) => {
                  const symbol = ticker.symbol.split('/')[0];
                  const isSelected = ticker.symbol === selectedSymbol;
                  const changeColor = ticker.change24hPercent >= 0 ? '#00c087' : '#ff5c5c';
                  const fundingColor = (ticker.fundingRate || 0) >= 0 ? '#00c087' : '#ff5c5c';
                  
                  return (
                    <tr
                      key={ticker.symbol}
                      onClick={() => setSelectedSymbol(ticker.symbol)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? (isDark ? 'rgba(0, 192, 135, 0.1)' : 'rgba(0, 192, 135, 0.05)') : 'transparent',
                        borderBottom: `1px solid ${borderColor}`,
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: 600,
                              color: isDark ? '#fff' : '#333'
                            }}
                          >
                            {symbol.substring(0, 1)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: isDark ? '#fff' : '#333' }}>{symbol}</div>
                            <div style={{ fontSize: '11px', color: isDark ? '#718096' : '#666' }}>
                              {formatVolume(ticker.volume24h || 0)} USDT • 20x
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 500, color: isDark ? '#fff' : '#333' }}>
                        ${ticker.last?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: changeColor, fontWeight: 500 }}>
                        {ticker.change24hPercent >= 0 ? '+' : ''}{ticker.change24hPercent?.toFixed(2) || '0.00'}%
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: fundingColor, fontWeight: 500 }}>
                        {formatFundingRate(ticker.fundingRate)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </div>
  );
}
