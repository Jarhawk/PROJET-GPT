import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function PriceDelta({ puHT, pmp }) {
  if (!pmp) return null;
  const diff = puHT - pmp;
  const pct = pmp ? Math.round((diff / pmp) * 100) : 0;
  let Icon = Minus;
  let label = 'PU égal au PMP';
  if (diff > 0.005) {
    Icon = ArrowUp;
    label = `PU supérieur au PMP de ${pct}%`;
  } else if (diff < -0.005) {
    Icon = ArrowDown;
    label = `PU inférieur au PMP de ${Math.abs(pct)}%`;
  }
  return (
    <span
      className="inline-flex items-center ml-1 text-xs text-muted-foreground"
      title={label}
      aria-label={label}
    >
      <Icon size={12} />
    </span>
  );
}
