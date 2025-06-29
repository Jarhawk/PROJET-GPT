// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();

  const changeLanguage = e => {
    const lng = e.target.value;
    i18n.changeLanguage(lng);
    localStorage.setItem('lang', lng);
  };

  return (
    <select
      onChange={changeLanguage}
      value={i18n.language}
      className="px-2 py-1 text-sm rounded-md bg-mamastock-gold text-black"
      aria-label={t('language')}
    >
      <option value="fr">🇫🇷 {t('french')}</option>
      <option value="en">🇬🇧 {t('english')}</option>
      <option value="es">🇪🇸 {t('spanish')}</option>
    </select>
  );
}
