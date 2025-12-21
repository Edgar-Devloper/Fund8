import React from "react";
import { Routes, Route } from "react-router-dom";

/// Css - Solo lo esencial para Trading
import "./index.css";

/// Layout - Solo lo esencial
import ScrollToTop from './pages/ScrollToTop';
import NFTSelectionModal from "./components/NFTSelectionModal";
import PremiumUpgradeNotification from "./components/PremiumUpgradeNotification";

/// Trading - Página principal
import TradingPage from './pages/Trading';

/// Prop Dashboard - Página del Prop Dashboard
import PropDashboard from './pages/PropDashboard';

/// Operations - Página de operaciones de trading
import OperationsPage from './pages/Operations';

/// NFT Registration - Página de registro de NFT
import NFTRegistration from './pages/NFTRegistration';

/// NFT Flow - Pantallas del flujo de compra de NFT
import SelectNFTCollection from './pages/NFT/SelectNFTCollection';
import ChooseCharacter from './pages/NFT/ChooseCharacter';
import BuyPet from './pages/NFT/BuyPet';
import PetConfirmation from './pages/NFT/PetConfirmation';

const Markup = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<TradingPage />} />
        <Route path="/trading" element={<TradingPage />} />
        {/* Prop Dashboard */}
        <Route path="/prop-dashboard" element={<PropDashboard />} />
        <Route path="/propfirm" element={<PropDashboard />} />
        {/* Operations - Trading Operations */}
        <Route path="/operations" element={<OperationsPage />} />
        {/* Ruta para registro de NFT - detecta plataforma automáticamente */}
        <Route path="/register" element={<NFTRegistration />} />
        <Route path="/nft/register" element={<NFTRegistration />} />
        {/* Flujo de compra de NFT */}
        <Route path="/nft/select-nft-collection" element={<SelectNFTCollection />} />
        <Route path="/nft/choose-character" element={<ChooseCharacter />} />
        <Route path="/nft/buy-pet" element={<BuyPet />} />
        <Route path="/nft/pet-confirmation" element={<PetConfirmation />} />
        {/* Catch all - redirect to trading */}
        <Route path="*" element={<TradingPage />} />
      </Routes>
      <ScrollToTop />
      <NFTSelectionModal />
      <PremiumUpgradeNotification />
    </>
  );
};

export default Markup;
