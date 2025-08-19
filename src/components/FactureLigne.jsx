// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useRef } from 'react'
import ProductPickerModal from '@/components/forms/ProductPickerModal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const parseNum = (v) => parseFloat(String(v).replace(',', '.')) || 0

export default function FactureLigne({
  ligne,
  index,
  onChange,
  onRemove,
  onProduitFocus,
  existingProductIds = [],
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const quantiteRef = useRef(null)

  const handleProduitSelection = (p) => {
    if (p?.id) {
      const q = parseNum(ligne.quantite)
      const pu = parseNum(ligne.pu)
      onChange({
        ...ligne,
        produit: p,
        produit_id: p.id,
        pmp: p.pmp ?? 0,
        total_ht: (q * pu).toFixed(2),
      })
      setTimeout(() => quantiteRef.current?.focus(), 0)
    }
  }

  const handleQuantite = (val) => {
    const q = parseNum(val)
    const pu = parseNum(ligne.pu)
    onChange({ ...ligne, quantite: val, total_ht: (q * pu).toFixed(2) })
  }

  const handlePu = (val) => {
    const q = parseNum(ligne.quantite)
    const pu = parseNum(val)
    onChange({ ...ligne, pu: val, total_ht: (q * pu).toFixed(2) })
  }

  return (
    <div className="flex min-w-0 items-center gap-2 overflow-x-hidden">
      <div className="basis-[30%] min-w-0">
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={ligne.produit?.nom || ''}
            placeholder="Choisir un produit…"
            onClick={() => {
              setPickerOpen(true)
              onProduitFocus?.(index)
            }}
            className="cursor-pointer"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPickerOpen(true)
              onProduitFocus?.(index)
            }}
          >
            Rechercher
          </Button>
        </div>
        <ProductPickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={handleProduitSelection}
          excludeIds={existingProductIds}
        />
      </div>
      <div className="basis-[15%] min-w-0">
        <Input
          type="number"
          step="any"
          ref={quantiteRef}
          className="h-10 w-full rounded-xl text-right truncate"
          value={ligne.quantite}
          onChange={(e) => handleQuantite(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        />
      </div>
      <div className="basis-[15%] min-w-0">
        <Input
          type="number"
          step="any"
          className="h-10 w-full rounded-xl text-right truncate"
          value={ligne.pu}
          onChange={(e) => handlePu(e.target.value)}
          onBlur={() => handlePu(parseNum(ligne.pu).toFixed(2))}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        />
      </div>
      <div className="basis-[15%] min-w-0">
        <Input
          type="number"
          step="any"
          className="h-10 w-full rounded-xl text-right truncate"
          value={ligne.tva}
          onChange={(e) => onChange({ ...ligne, tva: e.target.value })}
        />
      </div>
      <div className="basis-[20%] min-w-0">
        <Input
          type="text"
          readOnly
          tabIndex={-1}
          value={ligne.total_ht}
          className="pointer-events-none h-10 w-full select-none rounded-xl text-right truncate"
          aria-readonly="true"
        />
      </div>
      <div className="basis-[5%] flex justify-center min-w-0">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onRemove?.(index)}
          className="h-10 px-2"
        >
          ❌
        </Button>
      </div>
    </div>
  )
}
