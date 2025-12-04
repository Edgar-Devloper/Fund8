import React, { useState, useCallback, useEffect } from "react";
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
import "../../components/trading/hyperliquid-theme.css";
import "../../components/trading/TradingComponents.css";
import "../../components/trading/responsive-adjustments.css";
import "../../components/trading/animations.css";
import "./TradingPage.css";

const TradingPage = () => {
  const [showPairs, setShowPairs] = useState(false);
  const togglePairs = useCallback(() => setShowPairs((s) => !s), []);

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

  // Cerrar con ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setShowPairs(false);
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
    </HyperliquidTradingProvider>
  );
};

export default TradingPage;
