/**
 * SettingsContext - Gestiona todas las configuraciones del usuario
 * Persiste en localStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  // Confirmations
  skipOpenOrderConfirmation: false,
  skipClosePositionConfirmation: false,
  holdToCloseAllPositions: false,
  
  // Trading
  optOutOfSpotDusting: false,
  persistTradingConnection: false,
  
  // Layout
  customizeLayout: false,
  
  // Display
  displayVerboseErrors: false,
  animateOrderBook: true,
  orderBookSetSizeOnClick: true,
  showBuysAndSellsOnChart: true,
  hidePNL: false,
  
  // Notifications & Sound
  disableBackgroundFillNotifications: false,
  disableSoundForFills: false,
  
  // Advanced
  showAllWarnings: true,
  disableTransactionDelayProtection: false,
  disableHIP3DexAbstraction: false,
  
  // UI Preferences
  theme: 'dark',
  language: 'en',
};

const STORAGE_KEY = 'fund8_user_settings';

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('[SettingsContext] Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('[SettingsContext] Error saving settings:', error);
      }
    }
  }, [settings, isLoading]);

  // Update a single setting
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Update multiple settings at once
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  // Reset to default settings
  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get a specific setting value
  const getSetting = useCallback((key) => {
    return settings[key];
  }, [settings]);

  const value = {
    settings,
    updateSetting,
    updateSettings,
    resetToDefaults,
    getSetting,
    isLoading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
































