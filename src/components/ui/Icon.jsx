import * as Icons from 'lucide-react';

// Utilisation:
//   <Icon name="Home" className="h-4 w-4" />
// - name: string (nom du composant lucide-react)
// - fallback: Circle si introuvable
export default function Icon({ name, className = '', ...props }) {
  const Lucide = (name && Icons[name]) ? Icons[name] : Icons.Circle;
  return <Lucide className={className} aria-hidden="true" {...props} />;
}
