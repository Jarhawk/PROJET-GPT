import { useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import ProductPickerModal from '@/components/forms/ProductPickerModal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function FactureLigne({ index, remove }) {
  const { register, setValue, watch } = useFormContext()
  const [pickerOpen, setPickerOpen] = useState(false)

  const q = watch(`lignes.${index}.quantite`)
  const pu = watch(`lignes.${index}.prix_unitaire_ht`)
  const tva = watch(`lignes.${index}.tva`)

  const montantHt = (Number(q) || 0) * (Number(pu) || 0)

  useEffect(() => {
    const ttc = montantHt * (1 + (Number(tva) || 0) / 100)
    setValue(`lignes.${index}.montant_ht`, montantHt)
    setValue(`lignes.${index}.montant_ttc`, ttc)
  }, [montantHt, tva, index, setValue])

  const handleProduitSelection = (p) => {
    if (!p) return
    setValue(`lignes.${index}.produit_id`, p.id)
    setValue(`lignes.${index}.designation`, p.nom)
    setValue(`lignes.${index}.prix_unitaire_ht`, p.pmp ?? 0)
    setPickerOpen(false)
  }

  return (
    <div className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr,auto] items-center gap-2 overflow-x-hidden">
      <div className="min-w-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPickerOpen(true)}
          className="h-10 w-full min-w-0 justify-start truncate"
        >
          {watch(`lignes.${index}.designation`) || 'Choisir...'}
        </Button>
        <ProductPickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={handleProduitSelection}
        />
        <input type="hidden" {...register(`lignes.${index}.produit_id`)} />
      </div>
      <div className="min-w-0">
        <Input
          type="number"
          step="any"
          className="h-10 w-full rounded-xl text-right"
          {...register(`lignes.${index}.quantite`, { valueAsNumber: true, min: 0 })}
        />
      </div>
      <div className="min-w-0">
        <Input
          type="number"
          step="any"
          className="h-10 w-full rounded-xl text-right"
          {...register(`lignes.${index}.prix_unitaire_ht`, {
            valueAsNumber: true,
            min: 0,
          })}
        />
      </div>
      <div className="min-w-0">
        <Input
          type="number"
          step="any"
          className="h-10 w-full rounded-xl text-right"
          {...register(`lignes.${index}.tva`, { valueAsNumber: true, min: 0 })}
        />
      </div>
      <div className="min-w-0">
        <Input
          type="text"
          readOnly
          tabIndex={-1}
          value={montantHt.toFixed(2)}
          className="pointer-events-none h-10 w-full select-none rounded-xl text-right"
        />
      </div>
      <div className="flex justify-center">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => remove(index)}
          className="h-10 px-2"
        >
          ❌
        </Button>
      </div>
    </div>
  )
}
