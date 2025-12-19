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
import { HyperliquidTradingProvider } from "../../components/trading/context/HyperliquidTradingProvider";
import WelcomeMessageModal from "../../components/TradingPortal/WelcomeMessageModal";
import TradingPortalRegistrationModal from "../../components/TradingPortal/TradingPortalRegistrationModal";
import { useWallet } from "../../../context/WalletContext";
import "../../components/trading/hyperliquid-theme.css";
import "../../components/trading/TradingComponents.css";
import "../../components/trading/responsive-adjustments.css";
import "../../components/trading/animations.css";
import "./TradingPage.css";

const TradingPage = () => {
  const [showPairs, setShowPairs] = useState(false);
  const togglePairs = useCallback(() => setShowPairs((s) => !s), []);
  const { isConnected, address } = useWallet();
  const { tradingPortal } = useSelector(state => state.auth);
  
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
  // Debe aparecer siempre al cargar la página (como en la imagen)
  useEffect(() => {
    // Mostrar modal siempre al inicio (sin verificar sessionStorage)
    const timer = setTimeout(() => {
      setShowWelcomeModal(true);
    }, 800); // Delay para que la página cargue completamente
    
    return () => clearTimeout(timer);
  }, []); // Solo ejecutar una vez al montar

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

  // NO mostrar modal de registro automáticamente - solo cuando hagan clic en el botón Register

  // Resetear flags cuando cambia la wallet
  useEffect(() => {
    if (address) {
      welcomeModalShownRef.current = false;
      portalModalShownRef.current = false;
    }
  }, [address]);

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
