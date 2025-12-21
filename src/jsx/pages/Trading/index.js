import React, { useState, useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import OrderForm from "../../components/trading/OrderForm";
import OrderBook from "../../components/trading/OrderBook";
import ChartWrapper from "../../components/trading/ChartWrapper";
import PairsModal from "../../components/trading/PairsModal";
import HyperliquidNav from "../../components/trading/HyperliquidNav";
import TradingPairHeader from "../../components/trading/TradingPairHeader";
import TradingBottomPanel from "../../components/trading/TradingBottomPanel";
import MarketTicker from "../../components/trading/MarketTicker";
import TradingControls from "../../components/trading/TradingControls";
import ActivePositionsPanel from "../../components/trading/ActivePositionsPanel";
import TradingStatsPanel from "../../components/trading/TradingStatsPanel";
import UserInfoPanel from "../../components/trading/UserInfoPanel";
import { HyperliquidTradingProvider } from "../../components/trading/context/HyperliquidTradingProvider";
import WelcomeMessageModal from "../../components/TradingPortal/WelcomeMessageModal";
import TradingPortalRegistrationModal from "../../components/TradingPortal/TradingPortalRegistrationModal";
import { useWallet } from "../../../context/WalletContext";
import { useDispatch } from "react-redux";
import { tradingPortalLoadedAction } from "../../../store/actions/AuthActions";
import { getTradingPortalStatus } from "../../../services/TradingPortalService";
import "../../components/trading/hyperliquid-theme.css";
import "../../components/trading/TradingComponents.css";
import "../../components/trading/responsive-adjustments.css";
import "../../components/trading/animations.css";
import "./TradingPage.css";

const TradingPage = () => {
  const [showPairs, setShowPairs] = useState(false);
  const togglePairs = useCallback(() => setShowPairs((s) => !s), []);
  const { isConnected, address } = useWallet();
  const { tradingPortal, auth } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [portalStatusLoaded, setPortalStatusLoaded] = useState(false);
  
  // Modales de Trading Portal
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const welcomeModalShownRef = useRef(false);
  const portalModalShownRef = useRef(false);

  // Shared state between TradingControls and OrderForm
  const [orderConfig, setOrderConfig] = useState({
    orderType: 'limit',
    price: '',
    amount: '',
    marginMode: 'Cross',
    leverage: '20x',
    tpSl: false,
    hiddenOrder: false,
    reduceOnly: false,
    timeInForce: 'GTC'
  });

  // Lógica para mostrar modal de bienvenida al inicio
  // Esperar a que se cargue el estado del Trading Portal antes de mostrar el modal
  useEffect(() => {
    // Esperar a que el estado del portal se haya cargado
    if (isConnected && address && !portalStatusLoaded) {
      return; // No mostrar el modal hasta que se cargue el estado
    }
    
    // Dar tiempo para que se cargue el estado desde localStorage/backend
    const delay = isConnected && address ? 500 : 1500;
    const timer = setTimeout(() => {
      setShowWelcomeModal(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [isConnected, address, portalStatusLoaded]); // Depender de portalStatusLoaded

  // Mostrar modal de bienvenida nuevamente cuando se conecta la wallet
  // (si no tiene cuenta de Trading Portal)
  useEffect(() => {
    if (isConnected && address && !tradingPortal?.hasPortalAccount) {
      // Si se conectó la wallet y no tiene cuenta, mostrar el modal después de un breve delay
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, tradingPortal?.hasPortalAccount]);

  // Cerrar modal de bienvenida automáticamente después de login exitoso
  useEffect(() => {
    const isLoggedIn = !!auth?.idToken || !!localStorage.getItem('jwt_token');
    if (isLoggedIn && showWelcomeModal) {
      // Si el usuario se logueó, cerrar el modal de bienvenida
      console.log('[TradingPage] Usuario logueado, cerrando modal de bienvenida');
      setShowWelcomeModal(false);
    }
  }, [auth?.idToken, showWelcomeModal]);
  
  // También escuchar cambios en localStorage para detectar login
  useEffect(() => {
    const checkLogin = () => {
      const jwtToken = localStorage.getItem('jwt_token');
      if (jwtToken && showWelcomeModal) {
        console.log('[TradingPage] JWT token detectado, cerrando modal de bienvenida');
        setShowWelcomeModal(false);
      }
    };
    
    // Verificar inmediatamente
    checkLogin();
    
    // Escuchar cambios en localStorage
    window.addEventListener('storage', checkLogin);
    
    // También verificar periódicamente (por si el cambio es en la misma pestaña)
    const interval = setInterval(checkLogin, 500);
    
    return () => {
      window.removeEventListener('storage', checkLogin);
      clearInterval(interval);
    };
  }, [showWelcomeModal]);

  // NO mostrar modal de registro automáticamente - solo cuando hagan clic en el botón Register

  // Resetear flags cuando cambia la wallet
  useEffect(() => {
    if (address) {
      welcomeModalShownRef.current = false;
      portalModalShownRef.current = false;
    }
  }, [address]);

  // Cargar estado del Trading Portal desde localStorage cuando hay wallet conectada
  // Este efecto debe ejecutarse ANTES de mostrar el modal
  useEffect(() => {
    const loadTradingPortalStatus = async () => {
      if (!isConnected || !address) {
        setPortalStatusLoaded(true);
        return;
      }

      // Si ya tenemos el estado cargado, marcar como cargado
      if (tradingPortal?.hasPortalAccount) {
        console.log('[TradingPage] Estado ya cargado:', tradingPortal);
        setPortalStatusLoaded(true);
        return;
      }

      // Primero intentar cargar desde localStorage (más rápido, síncrono)
      try {
        const savedData = localStorage.getItem(`trading_portal_${address.toLowerCase()}`);
        if (savedData) {
          const portalData = JSON.parse(savedData);
          if (portalData.hasPortalAccount) {
            dispatch(tradingPortalLoadedAction({
              fullName: portalData.fullName || '',
              email: portalData.email || '',
              isVerified: portalData.isVerified || false,
            }));
            console.log('[TradingPage] Estado del Trading Portal cargado desde localStorage:', portalData);
            setPortalStatusLoaded(true);
            return;
          }
        }
      } catch (error) {
        console.error('[TradingPage] Error cargando desde localStorage:', error);
      }

      // Si no hay en localStorage, intentar cargar desde el backend
      try {
        console.log('[TradingPage] Cargando estado del Trading Portal desde backend para:', address);
        const result = await getTradingPortalStatus(address);
        
        if (result.success && result.data) {
          // Si hay cuenta, cargar el estado
          const portalData = {
            fullName: result.data.fullName || '',
            email: result.data.email || '',
            isVerified: result.data.isVerified || false,
          };
          dispatch(tradingPortalLoadedAction(portalData));
          
          // Guardar en localStorage para futuras cargas
          localStorage.setItem(`trading_portal_${address.toLowerCase()}`, JSON.stringify({
            hasPortalAccount: true,
            ...portalData,
          }));
          
          console.log('[TradingPage] Estado del Trading Portal cargado desde backend:', result.data);
        } else {
          // No hay cuenta, el estado ya está en false por defecto
          console.log('[TradingPage] No se encontró cuenta de Trading Portal');
        }
      } catch (error) {
        console.error('[TradingPage] Error cargando estado del Trading Portal:', error);
        // Si hay error (404), significa que no hay cuenta, no hacer nada
      } finally {
        setPortalStatusLoaded(true);
      }
    };

    // Ejecutar inmediatamente cuando hay wallet conectada
    loadTradingPortalStatus();
  }, [isConnected, address, dispatch]); // Removí tradingPortal?.hasPortalAccount de las dependencias para que siempre intente cargar

  // Cerrar con ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setShowPairs(false);
        setShowWelcomeModal(false);
        setShowPortalModal(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <HyperliquidTradingProvider>
      <HyperliquidNav />
      <TradingPairHeader />
      <div className="trading-page-content">

        {/* Layout: Chart + OrderBook izquierda | OrderForm derecha */}
        <div className="trading-main-layout">
          
          {/* COLUMNA IZQUIERDA: Chart + OrderBook + Active Positions */}
          <div className="trading-left-section">
            {/* Top Row: Chart + OrderBook */}
            <div className="trading-top-row">
              {/* Chart */}
              <div className="trading-chart-column">
                <div className="chart-container">
                  <ChartWrapper />
                </div>
              </div>
              
              {/* OrderBook al lado del chart */}
              <div className="trading-orderbook-column">
                <OrderBook />
              </div>
            </div>
            
            {/* Bottom Row: Active Positions + Trading Stats */}
            <div className="trading-positions-row">
              <div className="trading-bottom-left-grid">
                <ActivePositionsPanel />
                <TradingStatsPanel />
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Trading Controls + OrderForm */}
          <div className="trading-side-column">
            {/* User Info Panel */}
            <UserInfoPanel />
            
            {/* Trading Controls Section - Cross, 20x, M + Market/Limit/Stop Limit tabs */}
            <TradingControls 
              orderConfig={orderConfig}
              setOrderConfig={setOrderConfig}
            />
            
            {/* OrderForm - Moved down */}
            <div className="side-panel order-form-panel">
              <OrderForm 
                orderConfig={orderConfig}
                setOrderConfig={setOrderConfig}
              />
            </div>
          </div>

        </div>

        {/* Bottom Panel: Open Orders + Positions + History */}
        <TradingBottomPanel />

        {/* Modal Pares & Precio */}
        {showPairs && <PairsModal onClose={togglePairs} />}
      </div>
      
      {/* Market Ticker - Bottom scrolling ticker */}
      <MarketTicker />

      {/* Modal de bienvenida - aparece cuando hacen login */}
      <WelcomeMessageModal 
        show={showWelcomeModal} 
        onClose={() => {
          setShowWelcomeModal(false);
          welcomeModalShownRef.current = true;
        }} 
      />
    </HyperliquidTradingProvider>
  );
};

export default TradingPage;
