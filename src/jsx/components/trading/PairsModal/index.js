import React, { useState, useMemo, useEffect } from 'react';
import PairSelector from '../PairSelector';
import PriceTicker from '../PriceTicker';
import { useTradingData } from '../context/MockTradingDataProvider';

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
            <div>
              <SectionTitle title="Mercados Futuros" hint="Datos placeholder" />
              <p className="text-muted small mb-3">Aún no integrado feed de Hyperliquid Perps. Se reutiliza estructura Spot mientras definimos API.</p>
              <GlassPanel maxHeight="55vh">
                <div className="small text-muted">(Placeholder) Listado de contratos perpetuos se cargará aquí.</div>
              </GlassPanel>
            </div>
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
