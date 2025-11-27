import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationES from './locales/es.json';
import translationEN from './locales/en.json';
import translationPT from './locales/pt.json';
import translationAR from './locales/ar.json';

// Configuración de recursos de traducción
const resources = {
  es: {
    translation: translationES
  },
  en: {
    translation: translationEN
  },
  pt: {
    translation: translationPT
  },
  ar: {
    translation: translationAR
  }
};

// Función para cambiar dirección del texto (RTL desactivado temporalmente)
const changeDirection = (language) => {
  // TODO: Implementar RTL correctamente sin romper el diseño
  const direction = 'ltr'; // Mantener LTR para todos los idiomas por ahora
  document.documentElement.setAttribute('dir', direction);
  document.documentElement.setAttribute('lang', language);
};

i18n
  // Detector de idioma del navegador
  .use(LanguageDetector)
  // Pasar la instancia de i18n a react-i18next
  .use(initReactI18next)
  // Inicializar i18next
  .init({
    resources,
    fallbackLng: 'es', // Idioma por defecto
    debug: false, // Cambia a true para ver logs en desarrollo
    
    // Opciones de detección de idioma
    detection: {
      // Orden de detección: localStorage > navegador > fallback
      order: ['localStorage', 'navigator'],
      // Clave para guardar el idioma en localStorage
      lookupLocalStorage: 'i18nextLng',
      // Cache del idioma seleccionado
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false // React ya hace escape
    },
    
    // Namespaces
    ns: ['translation'],
    defaultNS: 'translation',
    
    react: {
      // Re-renderizar cuando cambie el idioma
      bindI18n: 'languageChanged',
      // Re-renderizar cuando se carguen traducciones
      bindI18nStore: '',
      // Suspense no usado
      useSuspense: false,
    }
  });

// Cambiar dirección al cargar la página
changeDirection(i18n.language);

// Listener para cambio de idioma
i18n.on('languageChanged', (lng) => {
  changeDirection(lng);
});

export default i18n;

