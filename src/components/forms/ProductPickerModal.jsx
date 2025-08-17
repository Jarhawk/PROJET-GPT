import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProductSearch } from '@/hooks/useProductSearch';

export default function ProductPickerModal({ open, onOpenChange, mamaId, onPick }) {
  const [term, setTerm] = useState('');
  const inputRef = useRef(null);

  // recherche branchée UNIQUEMENT sur table "produits" / colonne "nom"
  const {
    data: produits = [],
    isFetching,
    isError,
    error,
  } = useProductSearch({ mamaId, term, open, limit: 50 });

  // focus auto quand on ouvre
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setTerm('');
  }, [open]);

  // clavier: Enter sélectionne le premier résultat pour accélérer la saisie longue
  const first = useMemo(() => produits[0], [produits]);
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && first) {
      e.preventDefault();
      onPick?.(first);
      onOpenChange?.(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="product-picker-desc">
        <DialogTitle>Sélecteur de produits</DialogTitle>
        <DialogDescription id="product-picker-desc" className="sr-only">
          Recherchez un produit par nom. Tapez et validez avec Entrée pour choisir le premier résultat.
        </DialogDescription>

        <div className="space-y-3">
          <Input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Nom du produit…"
          />

          {isError && (
            <div className="text-sm text-red-600">
              Erreur de recherche : {error?.message ?? 'Inconnue'}
            </div>
          )}

          {isFetching && (
            <div className="text-sm text-muted-foreground">Recherche…</div>
          )}

          {!isFetching && produits.length === 0 && (
            <div className="text-sm text-muted-foreground">
              {term ? <>Aucun résultat pour « {term} ».</> : <>Aucun produit à afficher.</>}
            </div>
          )}

          {produits.length > 0 && (
            <ul className="max-h-80 overflow-auto divide-y rounded-md border">
              {produits.map((p) => (
                <li key={p.id} className="p-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.nom}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.code ?? '—'} · {p.unite_achat ?? p.unite_vente ?? 'u.'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      onPick?.(p);
                      onOpenChange?.(false);
                    }}
                  >
                    Sélectionner
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

