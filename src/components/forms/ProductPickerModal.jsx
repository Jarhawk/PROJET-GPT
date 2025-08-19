import DialogRoot, {
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  useLockBodyScroll,
} from '@/components/ui/SmartDialog'
import { useRef, useEffect, useState } from 'react'
import useProductSearch from '@/hooks/useProductSearch'

export default function ProductPickerModal({ open, onOpenChange, onSelect }) {
  useLockBodyScroll(open)
  const { query, setQuery, results, isLoading, error } = useProductSearch('')
  const inputRef = useRef(null)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    setActiveIdx(0)
  }, [results])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, (results?.length || 1) - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const p = results?.[activeIdx]
      if (p) {
        onSelect?.(p)
        onOpenChange?.(false)
      }
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground max-w-lg">
        {/* Header sticky avec recherche */}
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur p-4">
          <DialogTitle className="text-lg font-semibold">
            Sélecteur de produits
            <span className="ml-2 text-sm font-normal opacity-60">
              {isLoading ? 'Chargement…' : `(${results?.length ?? 0} résultats)`}
            </span>
          </DialogTitle>
          <DialogDescription id="product-search-desc" className="text-sm opacity-80">
            Recherchez un produit par son nom, puis validez avec Entrée ou cliquez pour sélectionner.
          </DialogDescription>

          <div className="mt-3">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher un produit par nom…"
              aria-label="Recherche produit"
              aria-describedby="product-search-desc"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            />
            </div>
          <p className="mt-2 text-xs opacity-60">
            Astuces : ↑/↓ pour naviguer • Entrée pour sélectionner • Échap pour fermer
          </p>
        </div>

        {/* Corps scrollable */}
        <div className="max-h-[65vh] overflow-y-auto p-4">
          {error && (
            <div className="mx-3 my-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
              Erreur de recherche : {error.message ?? 'inconnue'}
            </div>
          )}

          {!isLoading && (results?.length ?? 0) === 0 && !error && (
            <div className="mx-3 my-4 text-sm opacity-60">Aucun produit trouvé.</div>
          )}

          <ul className="space-y-1">
            {(results ?? []).map((p, idx) => {
              const lastPrix = p?.v_produits_dernier_prix?.[0]?.prix
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect?.(p)
                      onOpenChange?.(false)
                    }}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${idx === activeIdx ? 'border-primary/50 bg-primary/10' : 'border-transparent hover:border-primary/30 hover:bg-primary/5'}`}
                  >
                    <div className="truncate font-medium">{p.nom}</div>
                    <div className="text-xs opacity-60">
                      {lastPrix != null && (
                        <span>Dernier prix : {Number(lastPrix).toFixed(2)} € • </span>
                      )}
                      Stock : {p.stock_reel ?? 0} • PMP : {p.pmp != null ? Number(p.pmp).toFixed(2) : '-'}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur p-3 flex justify-end">
          <DialogClose asChild>
            <button type="button" className="rounded-lg border px-3 py-2 hover:bg-accent">
              Fermer
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}
