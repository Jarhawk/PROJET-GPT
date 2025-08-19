// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useForm, useFieldArray } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import FactureLigne from '@/components/FactureLigne'
import useFournisseursList from '@/hooks/useFournisseursList'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useInvoice } from '@/hooks/useInvoice'
import useSupabaseClient from '@/hooks/useSupabaseClient'
import { useAuth } from '@/hooks/useAuth'

const parseNum = (v) => parseFloat(String(v).replace(',', '.')) || 0

export function mapDbLineToUI(l) {
  const q = parseFloat(l.quantite) || 0
  const pu = parseFloat(l.pu ?? l.prix_unitaire) || 0
  return {
    id: l.id,
    produit: l.produit ?? { id: l.produit_id },
    produit_id: l.produit_id,
    quantite: String(q),
    pu: pu.toFixed(2),
    tva: l.tva ?? 0,
    total_ht: l.total_ht != null ? String(l.total_ht) : (q * pu).toFixed(2),
    pmp: l.pmp ?? 0,
  }
}

function createEmptyLine() {
  return {
    id: uuidv4(),
    produit: { id: '', nom: '' },
    produit_id: '',
    quantite: '0',
    pu: '0',
    tva: 0,
    total_ht: '0',
    pmp: 0,
  }
}

function FactureFormInner({ defaultValues, fournisseurs, onSaved, onClose }) {
  const form = useForm({ defaultValues })
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = form
  const { fields, append, remove, update } = useFieldArray({ control, name: 'lignes' })

  const lignes = watch('lignes')
  const statut = watch('statut') || 'BROUILLON'

  const statutColors = {
    BROUILLON: 'gray',
    VALIDEE: 'green',
    ANNULEE: 'red',
    PAYEE: 'blue',
  }

  const totals = useMemo(() => {
    let ht = 0
    let tva = 0
    lignes.forEach((l) => {
      const lineHt = parseNum(l.quantite) * parseNum(l.pu)
      ht += lineHt
      tva += lineHt * (parseNum(l.tva) / 100)
    })
    return { ht, tva, ttc: ht + tva }
  }, [lignes])

  const onSubmit = handleSubmit((data) => onSaved?.(data))

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Entête</h2>
          <Badge color={statutColors[statut]} className="capitalize">
            {statut.toLowerCase()}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-sm">Fournisseur</label>
              <Select {...register('fournisseur_id')} className="w-full">
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
              <Input {...register('numero')} />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Date</label>
              <Input type="date" {...register('date_facture')} />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Statut</label>
              <Select {...register('statut')} className="w-full">
                <option value="BROUILLON">BROUILLON</option>
                <option value="VALIDEE">VALIDEE</option>
                <option value="ANNULEE">ANNULEE</option>
                <option value="PAYEE">PAYEE</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <h2 className="text-lg font-semibold">Lignes</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="basis-[30%] min-w-0">Produit</div>
            <div className="basis-[15%] text-right">Qté</div>
            <div className="basis-[15%] text-right">Prix HT</div>
            <div className="basis-[15%] text-right">TVA</div>
            <div className="basis-[20%] text-right">Total HT</div>
            <div className="basis-[5%]" />
          </div>

          <div className="space-y-2">
            {fields.map((field, idx) => (
              <FactureLigne
                key={field.id}
                ligne={field}
                index={idx}
                onChange={(l) => update(idx, l)}
                onRemove={() => remove(idx)}
              />
            ))}
          </div>

          <Button type="button" onClick={() => append(createEmptyLine())} className="w-full">
            Ajouter une ligne
          </Button>
        </CardContent>
      </Card>

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
          <Button type="submit" disabled={isSubmitting}>
            Enregistrer
          </Button>
        </div>
      </Card>
    </form>
  )
}

export default function FactureForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const supabase = useSupabaseClient()
  const { session } = useAuth()
  const mamaId = (
    session?.user?.user_metadata?.mama_id ?? session?.user?.mama_id ?? ''
  ).toString()
  const isNew = !id || id === 'new'

  const { data: invoice, isLoading } = useInvoice(isNew ? undefined : id)
  const { data: fournisseurs = [] } = useFournisseursList({ actif: true })

  const defaultValues = invoice
    ? {
        id: invoice.id,
        numero: invoice.numero ?? '',
        date_facture: (invoice.date_facture ?? '').slice(0, 10),
        fournisseur_id: invoice.fournisseur_id ?? '',
        lignes: (invoice.lignes ?? []).map(mapDbLineToUI),
        statut: invoice.actif ? 'VALIDEE' : 'BROUILLON',
      }
    : {
        id: undefined,
        numero: '',
        date_facture: new Date().toISOString().slice(0, 10),
        fournisseur_id: '',
        lignes: [createEmptyLine()],
        statut: 'BROUILLON',
      }

  const handleSave = async ({
    id: fid,
    numero,
    date_facture,
    fournisseur_id,
    lignes,
    statut,
  }) => {
    try {
      const payload = {
        facture: {
          id: fid,
          numero,
          date_facture,
          fournisseur_id,
          actif: statut === 'VALIDEE' || statut === 'PAYEE',
        },
        lignes: (lignes || []).map((l) => ({
          id: l.id,
          produit_id: l.produit_id,
          quantite: parseNum(l.quantite),
          pu_ht: parseNum(l.pu),
          tva: parseNum(l.tva),
        })),
      }
      const cleanPayload = JSON.parse(JSON.stringify(payload))
      const { error } = await supabase.rpc('fn_save_facture', {
        p_mama_id: mamaId,
        p_payload: cleanPayload,
      })
      if (error) throw error
      toast.success('Facture enregistrée')
      navigate('/factures')
    } catch (e) {
      toast.error(e?.details || e?.message || "Erreur lors de l'enregistrement")
    }
  }

  if (isLoading) return <LoadingSpinner message="Chargement..." />

  return (
    <FactureFormInner
      defaultValues={defaultValues}
      fournisseurs={fournisseurs}
      onSaved={handleSave}
      onClose={() => navigate(-1)}
    />
  )
}

