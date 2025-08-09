// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Button } from './button';

export default function PaginationFooter({ page, pages, onPageChange, className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-4 mt-4 ${className}`}>
      <Button
        className="text-sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        Précédent
      </Button>
      <span className="text-sm">Page {page} sur {pages}</span>
      <Button
        className="text-sm"
        onClick={() => onPageChange(Math.min(pages, page + 1))}
        disabled={page >= pages}
      >
        Suivant
      </Button>
    </div>
  );
}
