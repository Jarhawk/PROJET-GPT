import {
  Root,
  Content,
  Title,
  Description,
  Close,
  useLockBodyScroll,
} from '@/components/ui/SmartDialog';
import { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import useProductSearch from '@/hooks/useProductSearch';

export default function ProductPickerModal({ open, onOpenChange, onSelect }) {
  useLockBodyScroll(open);
  const {
    query,
    setQuery,
    results = [],
    isLoading,
    error,
  } = useProductSearch('');
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 64,
  });

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    setActiveIdx(0);
    rowVirtualizer.scrollToIndex(0);
  }, [results]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => {
        const next = Math.min(i + 1, results.length - 1);
        rowVirtualizer.scrollToIndex(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => {
        const prev = Math.max(i - 1, 0);
        rowVirtualizer.scrollToIndex(prev);
        return prev;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const p = results[activeIdx];
      if (p) {
        onSelect?.(p);
        onOpenChange?.(false);
      }
    }
  };

  return (
    <Root open={open} onOpenChange={onOpenChange}>
      <Content className="bg-card text-card-foreground max-w-lg">
        {/* Header sticky avec recherche */}
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur p-4">
          <Title className="text-lg font-semibold">
            Sélecteur de produits
            <span className="ml-2 text-sm font-normal opacity-60">
              {isLoading ? 'Chargement…' : `(${results.length} résultats)`}
            </span>
          </Title>
          <Description id="product-search-help" className="text-sm opacity-80">
            Recherchez un produit par son nom, puis validez avec Entrée ou
            cliquez pour sélectionner.
          </Description>

          <div className="mt-3">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher un produit par nom…"
              aria-label="Recherche produit"
              aria-describedby="product-search-help"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <p className="mt-2 text-xs opacity-60">
            Astuces : ↑/↓ pour naviguer • Entrée pour sélectionner • Échap pour
            fermer
          </p>
        </div>

        {/* Corps scrollable */}
        <div ref={listRef} className="max-h-[65vh] overflow-y-auto p-4">
          {error && (
            <div className="mx-3 my-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
              Erreur de recherche : {error.message ?? 'inconnue'}
            </div>
          )}

          {!isLoading && results.length === 0 && !error && (
            <div className="mx-3 my-4 text-sm opacity-60">
              Aucun produit trouvé.
            </div>
          )}

          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const p = results[virtualRow.index];
              return (
                <div
                  key={p.id}
                  data-index={virtualRow.index}
                  ref={virtualRow.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect?.(p);
                      onOpenChange?.(false);
                    }}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${virtualRow.index === activeIdx ? 'border-primary/50 bg-primary/10' : 'border-transparent hover:border-primary/30 hover:bg-primary/5'}`}
                  >
                    <div className="truncate font-medium">{p.nom}</div>
                    <div className="text-xs opacity-60 flex flex-wrap gap-2">
                      {p.dernier_prix != null && (
                        <span>
                          Dernier: {Number(p.dernier_prix).toFixed(2)}
                        </span>
                      )}
                      <span>Stock: {p.stock_reel ?? 0}</span>
                      {p.pmp != null && (
                        <span>PMP: {Number(p.pmp).toFixed(2)}</span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur p-3 flex justify-end">
          <Close asChild>
            <button
              type="button"
              className="rounded-lg border px-3 py-2 hover:bg-accent"
            >
              Fermer
            </button>
          </Close>
        </div>
      </Content>
    </Root>
  );
}
