// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState, useCallback } from 'react';
import SmartDialog from '@/components/ui/SmartDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useProductSearch } from '@/hooks/useProductSearch';

function highlight(str, q) {
  if (!q) return str;
  const idx = str.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return str;
  return (
    <span>
      {str.slice(0, idx)}
      <mark>{str.slice(idx, idx + q.length)}</mark>
      {str.slice(idx + q.length)}
    </span>
  );
}

export default function ProductPickerModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { data: results = [] } = useProductSearch(query, { enabled: open });
  const pages = Math.max(1, Math.ceil(results.length / limit));
  const start = (page - 1) * limit;
  const visible = results.slice(start, start + limit);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (open) {
      setQuery('');
      setPage(1);
      setActive(-1);
    }
  }, [open]);

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (active >= 0) {
        e.preventDefault();
        onSelect?.(visible[active]);
        onClose?.();
      }
    } else if (e.key === 'Escape') {
      onClose?.();
    }
  }, [active, visible, onSelect, onClose]);

  return (
    <SmartDialog open={open} onClose={onClose} title="Sélecteur de produits">
      <div className="space-y-3" onKeyDown={handleKey}>
        <Input
          autoFocus
          placeholder="Recherche..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          data-lpignore="true"
          data-form-type="other"
        />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-1">Code</th>
              <th className="p-1">Nom</th>
              <th className="p-1">Unité achat</th>
              <th className="p-1 text-right">PU</th>
              <th className="p-1 text-right">PMP</th>
              <th className="p-1 text-right">TVA</th>
              <th className="p-1">Zone</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p, idx) => (
              <tr
                key={p.id}
                className={`cursor-pointer ${idx === active ? 'bg-white/20' : ''}`}
                onMouseEnter={() => setActive(idx)}
                onDoubleClick={() => {
                  onSelect?.(p);
                  onClose?.();
                }}
                onClick={() => {
                  setActive(idx);
                }}
              >
                <td className="p-1">{highlight(p.code || '', query)}</td>
                <td className="p-1">{highlight(p.nom || '', query)}</td>
                <td className="p-1">{p.unite_achat || ''}</td>
                <td className="p-1 text-right">{(p.prix_unitaire || 0).toFixed(2)}</td>
                <td className="p-1 text-right">{(p.pmp || 0).toFixed(2)}</td>
                <td className="p-1 text-right">{p.tva ?? ''}</td>
                <td className="p-1">{p.zone_id || ''}</td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td className="p-2 text-center text-sm opacity-70" colSpan={7}>
                  Aucun résultat
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Préc.
            </Button>
            <span className="text-sm">
              {page}/{pages}
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
            >
              Suiv.
            </Button>
          </div>
          <Select
            value={String(limit)}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="w-24"
          >
            <option value="20">20</option>
            <option value="50">50</option>
          </Select>
        </div>
      </div>
    </SmartDialog>
  );
}
