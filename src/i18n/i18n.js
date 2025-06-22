import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    fr: {
      translation: {
        "welcome": "Bienvenue",
        // autres clés ici
      },
    },
    en: {
      translation: {
        "welcome": "Welcome",
        // autres clés ici
      },
    },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
