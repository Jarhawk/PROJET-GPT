import { useTranslation } from 'react-i18next';

export default function useFormatters() {
  const { i18n } = useTranslation();

  const formatDate = date => {
    if (!date) return '';
    return new Intl.DateTimeFormat(i18n.language).format(new Date(date));
  };

  const formatCurrency = value => {
    if (value == null) return '';
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: i18n.language === 'fr' ? 'EUR' : i18n.language === 'es' ? 'EUR' : 'USD',
    }).format(Number(value));
  };

  const formatNumber = value => {
    if (value == null) return '';
    return new Intl.NumberFormat(i18n.language).format(Number(value));
  };

  return { formatDate, formatCurrency, formatNumber };
}
