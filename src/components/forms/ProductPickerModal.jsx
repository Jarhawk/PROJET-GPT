import { useEffect, useRef } from 'react'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose
} from '@/components/ui/SmartDialog'
import { X } from 'lucide-react'
import useProductSearch from '@/hooks/useProductSearch' // ton hook qui interroge "produits" par nom
import useDebounce from '@/hooks/useDebounce'

export default function ProductPickerModal({ open, onOpenChange, onSelect, initialQuery = '' }) {
  const inputRef = useRef(null)
  const { query, setQuery, isLoading, results, error } = useProductSearch(initialQuery)
  const q = useDebounce(query, 150)

  // focus auto au show
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 25) }, [open])

  // nb résultats
  const count = results?.length ?? 0

  // navigation clavier
  const activeIndexRef = useRef(0)
  useEffect(() => { activeIndexRef.current = 0 }, [q, open])

  const handleKeyDown = (e) => {
    if (!results?.length) return
    if ([ 'ArrowDown', 'ArrowUp', 'Enter' ].includes(e.key)) e.preventDefault()
    const max = results.length - 1
    if (e.key === 'ArrowDown') activeIndexRef.current = Math.min(max, activeIndexRef.current + 1)
    if (e.key === 'ArrowUp')   activeIndexRef.current = Math.max(0,   activeIndexRef.current - 1)
    if (e.key === 'Enter') {
      const item = results[activeIndexRef.current]
      if (item) { onSelect?.(item); onOpenChange(false) }
    }
    // force repaint en modifiant une valeur dérivée
    // (astuce simple : pas besoin de state supplémentaire)
    e.currentTarget.dataset.idx = String(activeIndexRef.current)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        {/* HEADER STICKY */}
        <div className="sticky top-0 z-[1] border-b border-black/10 dark:border-white/10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-semibold">Sélecteur de produits</DialogTitle>
            <span className="ml-1 text-xs text-muted-foreground">({count} résultats)</span>
            <div className="ml-auto" />
            <DialogClose className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
          <DialogDescription className="sr-only">Recherchez un produit par nom puis sélectionnez-le</DialogDescription>

          <div className="mt-3">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tapez un nom de produit…"
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 outline-none ring-0 focus:border-primary/40"
            />
          </div>
        </div>

        {/* LISTE SCROLLABLE */}
        <div className="max-h-[70vh] overflow-auto px-2 py-2">
          {error && (
            <div className="m-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
              Erreur de recherche&nbsp;: {error.message ?? String(error)}
            </div>
          )}

          {isLoading && <div className="px-3 py-2 text-sm text-muted-foreground">Recherche…</div>}

          {!isLoading && !count && (
            <div className="px-3 py-6 text-sm text-muted-foreground">Aucun produit</div>
          )}

          <ul className="space-y-1">
            {results?.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => { onSelect?.(p); onOpenChange(false) }}
                  className="w-full rounded-xl border border-transparent px-3 py-2 text-left hover:border-black/10 dark:hover:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-primary"
                  data-active={i === Number(inputRef.current?.dataset.idx)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{p.nom}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p.code ?? '—'}
                      </div>
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      {p.unite ?? ''}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}

