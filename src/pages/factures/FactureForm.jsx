// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import FactureLigne from '@/components/FactureLigne'
import useFournisseurs from '@/hooks/data/useFournisseurs'

export function mapDbLineToUI(l) {
  const q = parseFloat(l.quantite) || 0
  const pu = parseFloat(l.pu ?? l.prix_unitaire) || 0
  return {
    id: l.id,
    produit: l.produit ?? { id: l.produit_id },
    produit_id: l.produit_id,
    quantite: String(q),
    unite: l.unite ?? l.produit?.unite_achat ?? l.produit?.unite ?? '',
    total_ht: l.total_ht != null ? String(l.total_ht) : (q * pu).toFixed(2),
    pu: pu.toFixed(2),
    pmp: l.pmp ?? l.produit?.pmp ?? 0,
    tva: l.tva ?? l.produit?.tva_id ?? null,
    zone_id: l.zone_id ?? l.produit?.zone_stock_id ?? '',
    position: l.position ?? 0,
    note: l.note ?? '',
    actif: l.actif ?? true,
    manuallyEdited: false,
  }
}

function createEmptyLine(position) {
  return {
    id: uuidv4(),
    produit: { id: '', nom: '' },
    produit_id: '',
    quantite: '0',
    unite: '',
    total_ht: '0',
    pu: '0',
    pmp: 0,
    tva: 0,
    zone_id: '',
    position,
    note: '',
    actif: true,
    manuallyEdited: false,
  }
}

const parseNum = (v) => parseFloat(String(v).replace(',', '.')) || 0

export default function FactureForm({
  facture = null,
  lignes: initialLignes = [],
  fournisseurs: fournisseursProp,
  onSaved,
  onClose,
}) {
  const { data: fournisseursData = [] } = useFournisseurs({ actif: true })
  const fournisseurs = fournisseursProp || fournisseursData

  const [header, setHeader] = useState({
    numero: '',
    date_facture: new Date().toISOString().slice(0, 10),
    fournisseur_id: '',
  })

  const [lignes, setLignes] = useState([])

  useEffect(() => {
    if (facture) {
      setHeader({
        numero: facture.numero ?? '',
        date_facture: (facture.date_facture ?? '').slice(0, 10),
        fournisseur_id: facture.fournisseur_id ?? '',
      })
    }
  }, [facture])

  useEffect(() => {
    if (initialLignes && initialLignes.length) {
      setLignes(initialLignes)
    } else {
      setLignes([createEmptyLine(0)])
    }
  }, [initialLignes])

  const totals = useMemo(() => {
    let ht = 0
    let tva = 0
    lignes.forEach((l) => {
      const lineTotal = parseNum(l.total_ht)
      ht += lineTotal
      tva += lineTotal * (parseNum(l.tva) / 100)
    })
    const ttc = ht + tva
    return { ht, tva, ttc }
  }, [lignes])

  const handleLineChange = (idx, newLine) => {
    setLignes((ls) => ls.map((l, i) => (i === idx ? newLine : l)))
  }

  const handleRemoveLine = (idx) => {
    setLignes((ls) => ls.filter((_, i) => i !== idx))
  }

  const handleAddLine = () => {
    setLignes((ls) => [...ls, createEmptyLine(ls.length)])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSaved?.({ ...header, lignes })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ENTÊTE */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Entête</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm">Fournisseur</label>
              <Select
                value={header.fournisseur_id}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, fournisseur_id: e.target.value }))
                }
                className="w-full"
              >
                <option value="">Choisir...</option>
                {fournisseurs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm">Numéro</label>
              <Input
                value={header.numero}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, numero: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Date</label>
              <Input
                type="date"
                value={header.date_facture}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, date_facture: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LIGNES */}
      <Card className="overflow-hidden">
        <CardHeader>
          <h2 className="text-lg font-semibold">Lignes</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Table header */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="basis-[20%] min-w-0">Produit</div>
            <div className="basis-[10%] text-right">Qté</div>
            <div className="basis-[10%] text-right">Unité</div>
            <div className="basis-[10%] text-right">Total HT</div>
            <div className="basis-[10%] text-right">PU</div>
            <div className="basis-[10%] text-right">PMP</div>
            <div className="basis-[10%] text-right">TVA</div>
            <div className="basis-[15%] text-left">Zone</div>
            <div className="basis-[5%]" />
          </div>

          {/* Lines */}
          <div className="space-y-2">
            {lignes.map((ligne, idx) => (
              <FactureLigne
                key={ligne.id || idx}
                ligne={ligne}
                index={idx}
                onChange={(l) => handleLineChange(idx, l)}
                onRemove={handleRemoveLine}
              />
            ))}
          </div>

          <Button type="button" onClick={handleAddLine} className="w-full">
            Ajouter une ligne
          </Button>
        </CardContent>
      </Card>

      {/* TOTAUX + ACTIONS */}
      <Card>
        <CardContent>
          <div className="flex justify-end gap-8 text-sm">
            <div className="text-right">
              <div className="opacity-70">Total HT</div>
              <div className="font-semibold">{totals.ht.toFixed(2)} €</div>
            </div>
            <div className="text-right">
              <div className="opacity-70">TVA</div>
              <div className="font-semibold">{totals.tva.toFixed(2)} €</div>
            </div>
            <div className="text-right">
              <div className="opacity-70">Total TTC</div>
              <div className="font-semibold">{totals.ttc.toFixed(2)} €</div>
            </div>
          </div>
        </CardContent>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-white/10 bg-black/40 p-4">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
          )}
          <Button type="submit">Enregistrer</Button>
        </div>
      </Card>
    </form>
  )
}

