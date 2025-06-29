// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  es: { translation: es },
};

const storedLang = localStorage.getItem('lang');
const browserLang = navigator.language.split('-')[0];

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLang || browserLang || 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
    react: { useSuspense: false },
  });

export default i18n;
