import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/SmartDialog';
import useDebounce from '@/hooks/useDebounce';
import useProductSearch from '@/hooks/useProductSearch';
import { useMultiMama } from '@/context/MultiMamaContext';

export default function ProductPickerModal({ open, onOpenChange, onPick }) {
  const { mamaActif: currentMamaId } = useMultiMama(); // adapte si besoin
  const [term, setTerm] = useState('');
  const debounced = useDebounce(term, 120);
  const inputRef = useRef(null);

  const { data: produits = [], isFetching, error } = useProductSearch({
    mamaId: currentMamaId,
    term: debounced,
    open,
    limit: 50, // suffisant et rapide; on peut monter à 100 si besoin
  });

  // focus auto à l'ouverture
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setTerm('');
  }, [open]);

  // navigation clavier
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [debounced, open]);

  const hasResults = produits.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        {/* Header collant */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
          <div className="px-4 pt-4">
            <DialogTitle className="text-base font-semibold">Sélecteur de produits</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Recherchez par <strong>nom</strong>. Utilisez ↑/↓ puis <kbd>Entrée</kbd>.
            </DialogDescription>
          </div>
          <div className="p-4 pb-3">
            <input
              ref={inputRef}
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => {
                if (!hasResults) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, produits.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  onPick?.(produits[active]);
                  onOpenChange?.(false);
                }
              }}
              placeholder="Rechercher un produit par nom…"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </header>

        {/* Corps : scrollable */}
        <div className="flex-1 overflow-auto">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600">
              Erreur de recherche : {error.message}
            </div>
          )}
          {!error && !isFetching && !hasResults && (
            <div className="px-4 py-6 text-sm opacity-70">
              {debounced ? 'Aucun produit ne correspond.' : 'Commencez à saisir un nom de produit.'}
            </div>
          )}
          {/* Liste compacte */}
          {hasResults && (
            <ul className="divide-y">
              {produits.map((p, idx) => {
                const isActive = idx === active;
                return (
                  <li
                    key={p.id}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => {
                      onPick?.(p);
                      onOpenChange?.(false);
                    }}
                    className={[
                      'px-4 py-2 cursor-pointer select-none',
                      isActive ? 'bg-primary/5' : 'hover:bg-muted',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-medium">{p.nom}</span>
                      {isActive && <span className="text-[10px] uppercase opacity-60">Entrée</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {isFetching && (
            <div className="px-4 py-3 text-sm opacity-70">Recherche…</div>
          )}
        </div>

        {/* Footer collant */}
        <footer className="sticky bottom-0 bg-white/90 backdrop-blur border-t px-4 py-2 text-[11px] text-muted-foreground">
          {isFetching ? 'Chargement…' : `${produits.length} résultat(s)`}
        </footer>
      </DialogContent>
    </Dialog>
  );
}

