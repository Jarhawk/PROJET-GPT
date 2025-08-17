import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/SmartDialog';
import useDebounce from '@/hooks/useDebounce';
import useProductSearch from '@/hooks/useProductSearch';
import { useMultiMama } from '@/context/MultiMamaContext';

export default function ProductPickerModal({ open, onOpenChange, onPick }) {
  const { mamaActif: currentMamaId } = useMultiMama(); // adapte si nécessaire
  const [term, setTerm] = useState('');
  const debounced = useDebounce(term, 150);

  const { data: produits, isFetching, error } = useProductSearch({
    mamaId: currentMamaId,
    term: debounced,
    open,
    limit: 50,
  });

  // Navigation clavier (↑/↓/Enter)
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    setActiveIndex(0);
  }, [debounced, open]);

  const hasResults = (produits?.length ?? 0) > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setTerm('');
        onOpenChange?.(v);
      }}
    >
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <header className="px-4 pt-4 pb-2 border-b bg-white/70 backdrop-blur">
          <DialogTitle className="text-base font-semibold">Sélecteur de produits</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tapez pour rechercher par <strong>nom</strong>. Utilisez ↑/↓ puis <kbd>Entrée</kbd> pour sélectionner.
          </DialogDescription>
          <div className="mt-3">
            <input
              autoFocus
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => {
                if (!hasResults) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(i + 1, produits.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  onPick?.(produits[activeIndex]);
                  onOpenChange?.(false);
                }
              }}
              placeholder="Rechercher un produit par nom…"
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </header>

        {/* Corps liste */}
        <div className="max-h-80 overflow-auto">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600">
              Erreur de recherche : {error.message}
            </div>
          )}

          {isFetching && !hasResults && !error && (
            <div className="px-4 py-3 text-sm opacity-70">Chargement…</div>
          )}

          {!isFetching && !error && !hasResults && (
            <div className="px-4 py-3 text-sm opacity-70">
              {debounced ? 'Aucun produit ne correspond.' : 'Commencez à saisir un nom de produit.'}
            </div>
          )}

          {hasResults && (
            <ul className="divide-y">
              {produits.map((p, idx) => {
                const active = idx === activeIndex;
                return (
                  <li
                    key={p.id}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      onPick?.(p);
                      onOpenChange?.(false);
                    }}
                    className={[
                      'px-4 py-2 cursor-pointer select-none',
                      active ? 'bg-primary/5' : 'hover:bg-muted',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-medium">{p.nom}</span>
                      {/* Astuce UI : badge “Entrée” */}
                      {active && <span className="text-[10px] uppercase opacity-60">Entrée</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pied allégé */}
        <footer className="px-4 py-2 border-t text-[11px] text-muted-foreground bg-white/60">
          {isFetching ? 'Recherche…' : `${produits?.length ?? 0} résultat(s)`}
        </footer>
      </DialogContent>
    </Dialog>
  );
}

