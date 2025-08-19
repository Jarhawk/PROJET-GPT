import { useEffect, useRef, useState, useCallback, useId } from 'react'
import Dialog, {
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/SmartDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useVirtualizer } from '@tanstack/react-virtual'
import useProductSearch from '@/hooks/useProductSearch'
import { useLockBodyScroll } from '@/components/ui/SmartDialog'

export default function ProductPickerModal({
  open,
  onOpenChange,
  onSelect,
  returnFocusRef,
  excludeIds = [],
}) {
  useLockBodyScroll(open)
  const { query, setQuery, results: allResults, isLoading, error } =
    useProductSearch('')
  const results = (allResults || [])
    .filter((p, idx, arr) => arr.findIndex((r) => r.id === p.id) === idx)
    .filter((p) => !excludeIds.includes(p.id))
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputName = useId()

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    } else if (returnFocusRef?.current) {
      setTimeout(() => returnFocusRef.current?.focus(), 0)
    }
  }, [open, returnFocusRef, setQuery])

  useEffect(() => {
    setActiveIdx(0)
  }, [results])

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 44,
    overscan: 8,
  })

  useEffect(() => {
    virtualizer.scrollToIndex(activeIdx)
  }, [activeIdx, virtualizer])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const p = results[activeIdx]
      if (p) {
        onSelect?.(p)
        onOpenChange?.(false)
      }
    }
  }
  const close = useCallback(() => onOpenChange?.(false), [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 z-[1000] bg-background/40 backdrop-blur-sm" />
      <DialogContent className="fixed left-1/2 top-1/2 z-[1001] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card text-foreground shadow-2xl focus:outline-none">
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
          <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher un produit par nom…"
              aria-label="Recherche produit"
              aria-describedby="product-search-desc"
              autoComplete="off"
              name={`pp-${inputName}`}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="search"
              enterKeyHint="search"
            />
          </form>
          <p className="text-xs text-muted-foreground">
            Astuce : ↑/↓ pour naviguer · Entrée/Tab pour sélectionner · Échap pour fermer
          </p>
        </div>

        <div ref={listRef} className="overflow-y-auto" style={{ height: 400 }}>
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
                  key={virtualRow.key}
                  type="button"
                  onClick={() => {
                    onSelect?.(p)
                    close()
                  }}
                  className={`absolute left-0 top-0 flex h-11 w-full flex-col justify-center px-4 text-left ${
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'border-b border-border hover:bg-accent/50'
                  } focus:outline-none`}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
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
          <Button variant="outline" type="button" onClick={close}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
