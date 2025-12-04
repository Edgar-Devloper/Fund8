import React from "react";
import { Routes, Route } from "react-router-dom";

/// Css - Solo lo esencial para Trading
import "./index.css";

/// Layout - Solo lo esencial
import ScrollToTop from './pages/ScrollToTop';
import NFTSelectionModal from "./components/NFTSelectionModal";

/// Trading - Página principal (única que se usa)
import TradingPage from './pages/Trading';

const Markup = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<TradingPage />} />
        <Route path="/trading" element={<TradingPage />} />
        {/* Catch all - redirect to trading */}
        <Route path="*" element={<TradingPage />} />
      </Routes>
      <ScrollToTop />
      <NFTSelectionModal />
    </>
  );
};

export default Markup;
