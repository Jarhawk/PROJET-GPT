// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { forwardRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = forwardRef(function LanguageSelector(
  { className = "px-2 py-1 text-sm rounded-md bg-mamastock-gold text-black", ...props },
  ref
) {
  const { i18n, t } = useTranslation();

  const changeLanguage = useCallback(
    e => {
      const lng = e.target.value;
      i18n.changeLanguage(lng);
      localStorage.setItem('lang', lng);
    },
    [i18n]
  );

  return (
    <select
      ref={ref}
      onChange={changeLanguage}
      value={i18n.language}
      className={className}
      aria-label={t('language')}
      {...props}
    >
      <option value="fr">🇫🇷 {t('french')}</option>
      <option value="en">🇬🇧 {t('english')}</option>
      <option value="es">🇪🇸 {t('spanish')}</option>
    </select>
  );
});

export default LanguageSelector;
