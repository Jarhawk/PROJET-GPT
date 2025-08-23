import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const formatMoneyFR = (n) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export default function PriceDelta({ puHT = 0, pmp = 0 }) {
  const delta = puHT - pmp;

  let content = '—';
  let color = 'text-muted-foreground';
  let label = 'PU égal au PMP';

  if (delta > 0) {
    content = <ArrowUpRight size={12} />;
    color = 'text-red-500';
    label = `PU supérieur au PMP de ${formatMoneyFR(delta)}`;
  } else if (delta < 0) {
    content = <ArrowDownRight size={12} />;
    color = 'text-green-500';
    label = `PU inférieur au PMP de ${formatMoneyFR(-delta)}`;
  }

  return (
    <span
      className={`absolute right-2 inset-y-0 flex items-center pointer-events-none ${color}`}
      title={label}
      aria-label={label}
    >
      {content}
    </span>
  );
}
