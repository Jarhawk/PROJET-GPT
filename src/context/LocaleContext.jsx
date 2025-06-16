import { createContext, useEffect, useState } from 'react';
import { messages } from '../locale/messages';

const LocaleContext = createContext({
  locale: 'fr',
  setLocale: () => {},
  t: (key) => key,
});

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState('fr');

  useEffect(() => {
    const stored = localStorage.getItem('locale');
    if (stored) setLocale(stored);
  }, []);

  const changeLocale = (l) => {
    setLocale(l);
    localStorage.setItem('locale', l);
  };

  const t = (key) => messages[locale][key] || key;

  return (
    <LocaleContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export { LocaleContext };
