import SmartDialog, {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  useLockBodyScroll,
} from '@/components/ui/SmartDialog'
import { useRef, useEffect } from 'react'
import useProductSearch from '@/hooks/useProductSearch'

export default function ProductPickerModal({ open, onOpenChange, onSelect }) {
  const { query, setQuery, results, isLoading, error } = useProductSearch('')
  const inputRef = useRef(null)
  useLockBodyScroll(open)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground overflow-hidden">
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur p-4">
          <DialogTitle className="text-lg font-semibold">
            Sélecteur de produits
            <span className="ml-2 text-sm font-normal opacity-60">
              {isLoading ? 'Chargement…' : `(${results?.length ?? 0} résultats)`}
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm opacity-80">
            Tapez le nom du produit à rechercher.
          </DialogDescription>

          <div className="mt-3">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit par nom…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-2 text-xs opacity-60">
              Astuces : ↑/↓ pour naviguer • Entrée pour sélectionner • Échap pour fermer
            </p>
          </div>
        </div>

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
            {(results ?? []).map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect?.(p)
                    onOpenChange?.(false)
                  }}
                  className="w-full text-left rounded-xl border border-transparent hover:border-primary/30 hover:bg-primary/5 px-3 py-2 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{p.nom}</div>
                      <div className="text-xs opacity-70">{p.code || '—'}</div>
                    </div>
                    <div className="text-sm opacity-80">
                      {p.prix_achat ? p.prix_achat + ' ' + (p.monnaie || '') : ''}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

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
