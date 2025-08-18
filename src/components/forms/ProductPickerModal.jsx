import SmartDialog, {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/SmartDialog'
import { X } from 'lucide-react'
import { useRef } from 'react'
import useProductSearch from '@/hooks/useProductSearch'

export default function ProductPickerModal({ open, onOpenChange, onSelect }) {
  const { query, setQuery, results, isLoading, error } = useProductSearch('')
  const inputRef = useRef(null)

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          top-[8vh] translate-y-0 w-[min(880px,94vw)]
          rounded-2xl border
          border-white/10 dark:border-white/10
          bg-white/90 text-slate-900 shadow-2xl
          dark:bg-neutral-900/90 dark:text-neutral-50
          outline-none
        "
      >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/5 dark:border-white/10">
            <DialogTitle className="text-lg font-semibold">
              Sélecteur de produits
              <span className="ml-2 text-sm font-normal opacity-60">
                {isLoading ? 'Chargement…' : `(${results?.length ?? 0} résultats)`}
              </span>
            </DialogTitle>
            <DialogClose className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none">
              <X className="h-5 w-5" />
            </DialogClose>
          </div>

          <DialogDescription className="sr-only">
            Recherchez un produit par son nom, puis validez avec Entrée ou cliquez pour sélectionner.
          </DialogDescription>

          {/* Barre de recherche sticky */}
          <div className="sticky top-0 px-5 py-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur supports-[backdrop-filter]:bg-transparent border-b border-black/5 dark:border-white/10">
            <label className="block">
              <span className="sr-only">Rechercher</span>
              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Recherchez par nom…"
                className="
                  w-full rounded-xl px-4 py-2.5
                  bg-white/70 text-slate-900 placeholder:text-slate-500
                  dark:bg-neutral-800/80 dark:text-neutral-50 dark:placeholder:text-neutral-400
                  border border-black/10 dark:border-white/10
                  focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none
                "
              />
            </label>
            <p className="mt-2 text-xs opacity-60">
              Astuces : ↑/↓ pour naviguer • Entrée pour sélectionner • Échap pour fermer
            </p>
          </div>

          {/* Liste des résultats */}
          <div className="max-h-[56vh] overflow-y-auto px-2 py-2">
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
                    onClick={() => { onSelect?.(p); onOpenChange?.(false) }}
                    className="
                      w-full text-left px-4 py-3 rounded-xl
                      hover:bg-black/5 dark:hover:bg-white/10
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                      border border-transparent hover:border-black/10 dark:hover:border-white/10
                    "
                  >
                    <div className="truncate font-medium">{p.nom}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
      </DialogContent>
    </DialogRoot>
  )
}
