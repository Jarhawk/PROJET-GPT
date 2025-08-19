import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { X, Search } from "lucide-react";
import useProductSearch from "@/hooks/useProductSearch"; // ← ton hook existant
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Props attendues:
// open: bool, onOpenChange: fn(bool), mamaId: uuid,
// onPick: fn({ id, nom }), excludeIds?: string[]  (optionnel)
export default function ProductPickerModal({
  open,
  onOpenChange,
  mamaId,
  onPick,
  excludeIds = [],
}) {
  const [q, setQ] = useState("");
  const { results, isLoading, error } = useProductSearch(q, mamaId);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    if (!Array.isArray(results)) return [];
    if (!excludeIds?.length) return results;
    const set = new Set(excludeIds);
    return results.filter((r) => !set.has(r.id));
  }, [results, excludeIds]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setIdx(0);
      setQ("");
    }
  }, [open]);

  const commitPick = (item) => {
    if (!item) return;
    onPick?.(item);
    onOpenChange?.(false);
  };

  const onKeyDown = (e) => {
    if (!filtered.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commitPick(filtered[idx]);
    } else if (e.key === "Escape") {
      onOpenChange?.(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay dans le BODY, jamais clipé par un parent */}
        <Dialog.Overlay className="
          fixed inset-0 z-[90]
          bg-background/70 backdrop-blur-sm
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
        " />
        <Dialog.Content className="
          fixed z-[91] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-[min(800px,95vw)]
          rounded-2xl border border-border bg-card shadow-2xl
          outline-none
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95
        ">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Search className="h-4 w-4 opacity-70" />
            <Dialog.Title className="text-base font-semibold">Rechercher un produit</Dialog.Title>
            <div className="ml-auto" />
            <Dialog.Close asChild>
              <Button size="icon" variant="ghost" className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="p-4">
            <div className="relative">
              <Input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Tapez pour rechercher (↑/↓ pour naviguer, Entrée pour valider)"
                autoComplete="off" // ← pas de suggestions mémorisées
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60 pointer-events-none" />
            </div>

            <div className="mt-3 max-h-[50vh] overflow-y-auto rounded-lg border border-border">
              {isLoading && (
                <div className="p-4 text-sm text-muted-foreground">Recherche…</div>
              )}
              {error && (
                <div className="p-4 text-sm text-destructive">
                  Erreur : {error.message || "Recherche impossible"}
                </div>
              )}
              {!isLoading && !error && filtered.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">
                  Aucun produit.
                </div>
              )}

              <ul role="listbox" aria-label="Résultats" className="divide-y divide-border">
                {filtered.map((p, i) => (
                  <li
                    key={p.id}
                    role="option"
                    aria-selected={i === idx}
                    tabIndex={-1}
                    onMouseEnter={() => setIdx(i)}
                    onDoubleClick={() => commitPick(p)}
                    onClick={() => setIdx(i)}
                    className={`
                      px-3 py-2 cursor-pointer
                      ${i === idx ? "bg-accent text-accent-foreground" : "bg-card hover:bg-muted/60"}
                    `}
                  >
                    <div className="text-sm font-medium line-clamp-1">{p.nom}</div>
                    {p.code && (
                      <div className="text-xs text-muted-foreground/80">{p.code}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline">Annuler</Button>
              </Dialog.Close>
              <Button
                onClick={() => commitPick(filtered[idx])}
                disabled={!filtered[idx]}
              >
                Sélectionner
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
