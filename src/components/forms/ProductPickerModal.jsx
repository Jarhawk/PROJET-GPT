import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  useLockBodyScroll,
} from '@/components/ui/SmartDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import useProductSearch from '@/hooks/useProductSearch'

export default function ProductPickerModal({ open, onOpenChange, onSelect }) {
  useLockBodyScroll(open)
  const { query, setQuery, results, isLoading, error } = useProductSearch('')
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    setActiveIdx(0)
  }, [results])

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 56,
  })

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const p = results[activeIdx]
      if (p) {
        onSelect?.(p)
        onOpenChange?.(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 bg-black/60" />
      <DialogContent className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card text-card-foreground shadow-lg focus:outline-none">
        <div className="p-4 space-y-3">
          <DialogTitle className="text-lg font-semibold">
            Sélecteur de produits
            <span className="ml-2 text-sm font-normal opacity-60">
              {isLoading ? 'Chargement…' : `(${results.length} résultats)`}
            </span>
          </DialogTitle>
          <DialogDescription id="product-search-desc" className="text-sm text-muted-foreground">
            Recherchez un produit par son nom, puis validez avec Entrée ou cliquez pour sélectionner.
          </DialogDescription>
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher un produit par nom…"
            aria-label="Recherche produit"
            aria-describedby="product-search-desc"
          />
          <p className="text-xs text-muted-foreground">
            Astuce : ↑/↓ pour naviguer · Entrée pour sélectionner · Échap pour fermer
          </p>
        </div>

        <div ref={listRef} className="max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="m-4 rounded border border-destructive/50 bg-destructive/10 p-2 text-sm">
              Erreur : {error.message}
            </div>
          )}
          {!isLoading && results.length === 0 && !error && (
            <div className="m-4 text-sm text-muted-foreground">Aucun produit trouvé.</div>
          )}

          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const p = results[virtualRow.index]
              const active = virtualRow.index === activeIdx
              const lastPrice =
                p?.v_produits_dernier_prix?.[0]?.prix ?? p?.v_produits_dernier_prix?.prix
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect?.(p)
                    onOpenChange?.(false)
                  }}
                  className={`absolute left-0 w-full px-4 py-2 text-left ${
                    active
                      ? 'bg-primary/10 border border-primary/50'
                      : 'border-b border-border hover:bg-primary/5'
                  } focus:outline-none`}
                  style={{
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="flex justify-between gap-2">
                    <span className="truncate font-medium">{p.nom}</span>
                    {lastPrice != null && (
                      <span className="text-xs text-muted-foreground">
                        Dernier {Number(lastPrice).toFixed(2)}€
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>Stock {Number(p.stock_reel ?? 0)}</span>
                    <span>PMP {Number(p.pmp ?? 0).toFixed(2)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end border-t p-3">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Fermer
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

