import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/SmartDialog';
import useProductSearch from '@/hooks/useProductSearch';
import useDebounce from '@/hooks/useDebounce';
import { useMemo, useState, useEffect } from 'react';
import { useMultiMama } from '@/context/MultiMamaContext';

export default function ProductPickerModal({ open, onOpenChange, onPick }) {
  const { mamaActif: currentMamaId } = useMultiMama();
  const [term, setTerm] = useState('');
  const debounced = useDebounce(term, 200);

  const { data: produits, isFetching, error } = useProductSearch({
    mamaId: currentMamaId,
    term: debounced,
    open,
    limit: 50,
  });

  useEffect(() => {
    if (!open) setTerm('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Sélecteur de produits</DialogTitle>
        <DialogDescription>Recherchez un produit par son nom.</DialogDescription>

        <input
          autoFocus
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && produits?.length) {
              onPick?.(produits[0]);
              onOpenChange?.(false);
            }
          }}
          placeholder="Saisir le nom du produit…"
          className="w-full rounded-md border px-3 py-2"
        />

        {error && (
          <div className="text-red-600 text-sm mt-2">
            Erreur de recherche : {error.message}
          </div>
        )}

        <div className="mt-3 max-h-72 overflow-auto border rounded-md">
          {isFetching && !produits?.length ? (
            <div className="p-3 text-sm opacity-70">Chargement…</div>
          ) : produits?.length ? (
            <ul>
              {produits.map((p) => (
                <li
                  key={p.id}
                  className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center justify-between"
                  onClick={() => {
                    onPick?.(p);
                    onOpenChange?.(false);
                  }}
                >
                  <span className="truncate">{p.nom}</span>
                  {p.code ? <span className="opacity-60 text-xs ml-2">{p.code}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-sm opacity-70">Aucun produit</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

