import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThirdwebProvider } from 'thirdweb/react';
import { client } from './features/third-web/libs/client.lib';
import { store } from './store/store';
import { WalletProvider } from './context/WalletContext.js';
import ThirdwebSync from './context/ThirdwebSync';
import { AuthProvider } from './context/AuthContext.js';
import { NFTProvider } from './context/NFTContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { SettingsProvider } from './context/SettingsContext.js';
import ThemeContext from './context/ThemeContext';
import Markup from './jsx/index';
import './vendor/bootstrap-select/dist/css/bootstrap-select.min.css';
import './css/style.css';
import './scss/main.scss';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
// Inicializar i18n
import './i18n/config';
// Soporte RTL para árabe
import './i18n/rtl.css';
// Hyperliquid Theme Global
import './jsx/global-hyperliquid-theme.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode deshabilitado temporalmente para mejorar rendimiento inicial
  // <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        {client && ThirdwebProvider ? (
          <ThirdwebProvider>
            <WalletProvider>
              <ThirdwebSync />
              <ThemeContext>
                <NotificationProvider>
                  <AuthProvider>
                  <NFTProvider>
                  <SettingsProvider>
                    <Markup />
                  </SettingsProvider>
                  </NFTProvider>
                  </AuthProvider>
                </NotificationProvider>
              </ThemeContext>
            </WalletProvider>
          </ThirdwebProvider>
        ) : (
          <ThemeContext>
            <NotificationProvider>
              <WalletProvider>
                <AuthProvider>
                <NFTProvider>
                <SettingsProvider>
                  <Markup />
                </SettingsProvider>
                </NFTProvider>
                </AuthProvider>
              </WalletProvider>
            </NotificationProvider>
          </ThemeContext>
        )}
      </Provider>
    </BrowserRouter>
  // </React.StrictMode>
);

