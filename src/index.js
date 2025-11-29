import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { WalletProvider } from './context/WalletContext.js';
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
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <ThemeContext>
          <NotificationProvider>
            <WalletProvider>
              <NFTProvider>
                <SettingsProvider>
                  <Markup />
                </SettingsProvider>
              </NFTProvider>
            </WalletProvider>
          </NotificationProvider>
        </ThemeContext>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);

