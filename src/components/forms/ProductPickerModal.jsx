import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import useProductSearch from "@/hooks/useProductSearch";

export default function ProductPickerModal({
  open,
  onClose,
  onSelect,
  excludeIdsSameZone: _excludeIdsSameZone,
  currentLineProductId: _currentLineProductId,
}) {
  const [query, setQuery] = useState("");
  const { data: results = [] } = useProductSearch(query);

  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(-1);
    }
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = active >= 0 ? results[active] : results[0];
      if (target) {
        onSelect?.(target);
        onClose?.();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose?.();
    }
  };

  useEffect(() => {
    setActive(-1);
  }, [query, results]);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose?.()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0B1220]/60 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby="product-search-desc"
          className="fixed left-1/2 top-1/2 z-50 w-[min(900px,95vw)] max-h-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <Dialog.Title className="text-sm font-semibold">Rechercher un produit</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 rounded-md hover:bg-muted">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher un produit…"
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              aria-describedby="product-search-desc"
              className="w-full px-4 py-2 font-semibold text-white placeholder-white/50 bg-white/10 backdrop-blur rounded-md shadow-lg border border-white/20 ring-1 ring-white/20 focus:outline-none hover:bg-white/10"
            />
            <p id="product-search-desc" className="sr-only">
              Recherche par nom de produit (ILIKE sur produits.nom)
            </p>
            <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
              {results.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Aucun résultat</div>
              ) : (
                results.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelect?.(p);
                      onClose?.();
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-accent ${idx === active ? "bg-accent" : ""}`}
                  >
                    {p.nom}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-border bg-muted/40 flex justify-end">
            <Button variant="secondary" onClick={() => onClose?.()}>
              Fermer
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

