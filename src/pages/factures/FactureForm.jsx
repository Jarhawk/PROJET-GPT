import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import FactureLigne from '@/components/FactureLigne'
import useFournisseurs from '@/hooks/data/useFournisseurs'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useInvoice } from '@/hooks/useInvoice'
import useSupabaseClient from '@/hooks/useSupabaseClient'
import { useAuth } from '@/hooks/useAuth'

const parseNum = (v) => parseFloat(String(v).replace(',', '.')) || 0

function mapDbLineToForm(l) {
  const q = parseNum(l.quantite)
  const pu = parseNum(l.pu_ht ?? l.pu ?? l.prix_unitaire)
  const ht = q * pu
  return {
    id: l.id,
    produit_id: l.produit_id,
    designation: l.produit?.nom || '',
    quantite: q,
    prix_unitaire_ht: pu,
    tva: parseNum(l.tva),
    montant_ht: ht,
    montant_ttc: ht * (1 + parseNum(l.tva) / 100),
  }
}

function createEmptyLine() {
  return {
    id: uuidv4(),
    produit_id: '',
    designation: '',
    quantite: 0,
    prix_unitaire_ht: 0,
    tva: 0,
    montant_ht: 0,
    montant_ttc: 0,
  }
}

function FactureFormInner({ facture, lignes, fournisseurs, onSaved, onClose }) {
  const methods = useForm({
    defaultValues: {
      fournisseur_id: facture?.fournisseur_id || '',
      date_facture: facture?.date_facture || new Date().toISOString().slice(0, 10),
      numero: facture?.numero || '',
      lignes: lignes.length ? lignes : [createEmptyLine()],
    },
  })
  const { control, handleSubmit, watch, formState } = methods
  const { fields, append, remove } = useFieldArray({ control, name: 'lignes' })

  const allLignes = watch('lignes')
  const totals = useMemo(() => {
    return allLignes.reduce(
      (acc, l) => {
        const ht = parseNum(l.montant_ht)
        const tva = ht * (parseNum(l.tva) / 100)
        acc.ht += ht
        acc.tva += tva
        acc.ttc = acc.ht + acc.tva
        return acc
      },
      { ht: 0, tva: 0, ttc: 0 }
    )
  }, [allLignes])

  const onSubmit = (data) => {
    onSaved?.(data)
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Entête</h2>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm">Fournisseur</label>
              <Select {...methods.register('fournisseur_id')} className="h-10 w-full rounded-xl border px-3">
                <option value="">Choisir...</option>
                {fournisseurs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm">Date</label>
              <Input type="date" className="h-10 w-full" {...methods.register('date_facture')} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Numéro</label>
              <Input className="h-10 w-full" {...methods.register('numero')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Lignes</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="basis-[30%] min-w-0">Produit</div>
              <div className="basis-[15%] text-right">Qté</div>
              <div className="basis-[15%] text-right">Prix HT</div>
              <div className="basis-[15%] text-right">TVA</div>
              <div className="basis-[20%] text-right">Total HT</div>
              <div className="basis-[5%]" />
            </div>
            {fields.map((field, idx) => (
              <FactureLigne key={field.id} index={idx} remove={remove} />
            ))}
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
              <Button type="button" variant="outline" onClick={onClose} disabled={formState.isSubmitting}>
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={formState.isSubmitting}>
              Enregistrer
            </Button>
          </div>
        </Card>
      </form>
    </FormProvider>
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
  const { data: fournisseurs = [] } = useFournisseurs({ actif: true })

  const facture = invoice
    ? {
        id: invoice.id,
        numero: invoice.numero ?? '',
        date_facture: (invoice.date_facture ?? '').slice(0, 10),
        fournisseur_id: invoice.fournisseur_id ?? '',
      }
    : null

  const lignes = useMemo(() => (invoice?.lignes ?? []).map(mapDbLineToForm), [invoice])

  const handleSave = async ({ fournisseur_id, date_facture, numero, lignes: ls }) => {
    try {
      const payload = {
        facture: { id: facture?.id, numero, date_facture, fournisseur_id },
        lignes: (ls || []).map((l) => ({
          id: l.id,
          produit_id: l.produit_id,
          quantite: parseNum(l.quantite),
          pu_ht: parseNum(l.prix_unitaire_ht),
          tva: parseNum(l.tva),
        })),
      }
      const { error } = await supabase.rpc('fn_facture_save', {
        p_mama_id: mamaId,
        p_payload: payload,
      })
      if (error) throw error
      toast.success('Facture enregistrée')
      navigate('/factures')
    } catch (e) {
      toast.error(e.message || "Erreur lors de l'enregistrement")
    }
  }

  if (isLoading) return <LoadingSpinner message="Chargement..." />

  return (
    <FactureFormInner
      facture={facture}
      lignes={lignes}
      fournisseurs={fournisseurs}
      onSaved={handleSave}
      onClose={() => navigate(-1)}
    />
  )
}
