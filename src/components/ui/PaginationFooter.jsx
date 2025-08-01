// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from 'react';
import { Button } from './button';

export default function PaginationFooter({ page, pages, onPageChange, className = '' }) {
  return (
    <div className={`flex justify-between mt-2 ${className}`}>
      <Button variant="outline" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
        Précédent
      </Button>
      <span>
        Page {page}/{pages}
      </span>
      <Button variant="outline" onClick={() => onPageChange(Math.min(pages, page + 1))} disabled={page >= pages}>
        Suivant
      </Button>
    </div>
  );
}
