// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import GlassCard from './GlassCard';
import TableContainer from './TableContainer';

export default function ListingContainer({ children, className = '', ...props }) {
  return (
    <GlassCard width="w-full max-w-full" className={`p-0 ${className}`} {...props}>
      <TableContainer className="p-0">{children}</TableContainer>
    </GlassCard>
  );
}
