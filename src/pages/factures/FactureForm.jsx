// src/pages/factures/FactureForm.jsx
import { useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import supabase from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import FactureLigne from "@/components/FactureLigne";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const today = () => format(new Date(), "yyyy-MM-dd");

/**
 * mapDbLineToUI
 * Objectif : convertir une ligne DB (facture_lignes + éventuels champs joints produit/zone)
 * en forme UI attendue par la ligne du formulaire (sans rien inventer).
 *
 * Champs gérés côté UI (d’après tes spécifications) :
 * - produit_id (sélectionné via popup)
 * - quantite (éditable)
 * - uniteLabel (affichée, non éditable)  -> best-effort si join dispo
 * - prix_total_ht (éditable €)
 * - prix_unitaire_ht (calcul auto = total / quantite, non éditable)
 * - pmp (affiché, non éditable)          -> depuis produit si dispo
 * - tva (en %, chargée du produit si dispo, éditable)
 * - zone_id (chargée du produit si dispo, éditable)
 *
 * La fonction est tolérante : si la ligne ne possède pas montant/prix_unitaire,
 * on calcule au mieux. Aucune dépendance à des colonnes non présentes.
 */
export function mapDbLineToUI(dbLine, produitJoin = null) {
  const qte = Number(dbLine?.quantite ?? 0);

  // valeurs possibles selon ton schéma (les colonnes montant_ht/prix_unitaire_ht
  // peuvent exister ou non selon l’état)
  const puDb = dbLine?.prix_unitaire_ht != null ? Number(dbLine.prix_unitaire_ht) : null;
  const mtDb = dbLine?.montant_ht != null ? Number(dbLine.montant_ht) : null;

  // si on a le montant HT côté DB, on l’utilise; sinon on dérive
  const prix_total_ht = mtDb != null
    ? mtDb
    : (puDb != null && qte > 0 ? Number((puDb * qte).toFixed(4)) : 0);

  // prix unitaire calculé si possible (sinon retombe sur puDb ou 0)
  const prix_unitaire_ht = qte > 0
    ? Number((prix_total_ht / qte).toFixed(6))
    : Number((puDb ?? 0).toFixed(6));

  // Best-effort pour les infos produit/join (on ne crée rien qui n’existe pas)
  const produit = produitJoin ?? dbLine?.produit ?? null;

  // PMP et unité sont affichés (non éditables) si fournis par le produit
  const pmp = produit?.pmp != null ? Number(produit.pmp) : null;

  // pas de colonne "unite" garantie en base : on affiche un label si présent
  const uniteLabel =
    produit?.unite_nom ??
    produit?.unite ??
    dbLine?.unite ??
    null;

  // TVA : charge depuis la ligne, ou défaut depuis le produit si dispo
  const tva = dbLine?.tva != null
    ? Number(dbLine.tva)
    : (produit?.tva != null ? Number(produit.tva) : 0);

  // Zone : charge depuis la ligne, sinon depuis le produit si dispo
  const zone_id = dbLine?.zone_id ?? produit?.zone_id ?? null;

  return {
    id: dbLine?.id ?? null,
    produit_id: dbLine?.produit_id ?? null,
    quantite: qte,
    uniteLabel,
    prix_total_ht,
    prix_unitaire_ht,
    pmp,
    tva,
    zone_id,
  };
}

export default function FactureForm() {
  const { profile } = useAuth();
  const mamaId = profile?.mama_id || null;

  // Fournisseurs
  const { data: fournisseursData, isLoading: loadingF } = useQuery({
    queryKey: ["fournisseurs", mamaId],
    enabled: !!mamaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fournisseurs")
        .select("id, nom")
        .eq("mama_id", mamaId)
        .eq("actif", true)
        .order("nom", { ascending: true });
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
  });
  const fournisseurs = Array.isArray(fournisseursData) ? fournisseursData : [];

  // Zones (liste globale, préremplie ligne par ligne si default_zone_id arrive du produit)
  const { data: zonesData } = useQuery({
    queryKey: ["zones_stock", mamaId],
    enabled: !!mamaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zones_stock")
        .select("id, nom")
        .eq("mama_id", mamaId)
        .order("nom", { ascending: true });
      if (error) return [];
      return data || [];
    },
  });
  const zones = Array.isArray(zonesData) ? zonesData : [];

  const form = useForm({
    defaultValues: {
      fournisseur_id: "",
      date_facture: today(),
      numero: "",
      statut: "valide", // mappe vers p_actif
      lignes: [
        {
          id: crypto.randomUUID(),
          produit_id: null,
          produit_nom: "",
          quantite: 1,
          unite: "",
          prix_total_ht: 0,
          pmp: 0,
          tva: 0,
          zone_id: "",
        },
      ],
    },
  });

  const { control, handleSubmit, watch, reset } = form;
  const { fields, append, remove, update } = useFieldArray({ control, name: "lignes" });
  const lignes = watch("lignes");

  // Totaux facture (HT = somme des prix_total_ht ; TVA et TTC calculés par ligne)
  const totals = useMemo(() => {
    let ht = 0, tvaSum = 0;
    for (const l of lignes || []) {
      const lht = Number(l.prix_total_ht || 0);
      const ltva = lht * (Number(l.tva || 0) / 100);
      ht += lht; tvaSum += ltva;
    }
    const total_ht = +ht.toFixed(2);
    const tva = +tvaSum.toFixed(2);
    const total_ttc = +(total_ht + tva).toFixed(2);
    return { total_ht, tva, total_ttc };
  }, [lignes]);

  const addLigne = () =>
    append({
      id: crypto.randomUUID(),
      produit_id: null,
      produit_nom: "",
      quantite: 1,
      unite: "",
      prix_total_ht: 0,
      pmp: 0,
      tva: 0,
      zone_id: "",
    });

  const updateLigne = (i, patch) => update(i, { ...lignes[i], ...patch });

  const onSubmit = async (values) => {
    try {
      if (!mamaId) { toast.error("Organisation introuvable."); return; }
      if (!values.fournisseur_id) { toast.error("Sélectionnez un fournisseur."); return; }

      // Construire les lignes pour la RPC : PU = total_ht / qte
      const payloadLignes = (values.lignes || [])
        .filter(l => l.produit_id && Number(l.quantite) > 0)
        .map(l => {
          const q = Number(l.quantite || 0);
          const lht = Number(l.prix_total_ht || 0);
          const pu = q > 0 ? lht / q : 0;
          return {
            produit_id: l.produit_id,
            quantite: q,
            prix_unitaire_ht: +pu.toFixed(6),
            tva: Number(l.tva || 0),
            // Optionnel si ta RPC accepte zone_id sur la ligne:
            zone_id: l.zone_id || null,
          };
        });

      if (payloadLignes.length === 0) { toast.error("Ajoutez au moins une ligne produit."); return; }

      const rpcPayload = {
        p_mama_id: mamaId,
        p_fournisseur_id: values.fournisseur_id,
        p_numero: values.numero || null,
        p_date: values.date_facture,
        p_lignes: payloadLignes,
        p_actif: values.statut === "valide",
        // Si, plus tard, tu ajoutes dans SQL la MAJ TVA produit: p_update_product_tva: true
      };

      const { error } = await supabase.rpc("fn_save_facture", rpcPayload);
      if (error) throw error;

      toast.success("Facture enregistrée.");

      reset({
        fournisseur_id: "",
        date_facture: today(),
        numero: "",
        statut: "valide",
        lignes: [
          {
            id: crypto.randomUUID(),
            produit_id: null,
            produit_nom: "",
            quantite: 1,
            unite: "",
            prix_total_ht: 0,
            pmp: 0,
            tva: 0,
            zone_id: "",
          },
        ],
      });
    } catch (e) {
      console.error(e);
      toast.error("Une erreur est survenue. Merci de réessayer.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ENTÊTE */}
      <div className="rounded-xl border border-border bg-card p-4 grid gap-4 md:grid-cols-4 grid-cols-1">
        {/* Fournisseur */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Fournisseur</label>
          <Controller
            control={control}
            name="fournisseur_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder={loadingF ? "Chargement…" : "Sélectionner"} /></SelectTrigger>
                <SelectContent align="start" className="max-h-64 overflow-auto">
                  {fournisseurs.map((f) => <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Date */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Date</label>
          <Controller control={control} name="date_facture" render={({ field }) => <Input type="date" {...field} />} />
        </div>

        {/* Numéro */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Numéro</label>
          <Controller control={control} name="numero" render={({ field }) => <Input placeholder="N° facture" {...field} />} />
        </div>

        {/* Statut (mappe p_actif) */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Statut</label>
          <Controller
            control={control}
            name="statut"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="valide">Validée</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* LIGNES */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Lignes produits</h3>
          <Button type="button" variant="secondary" onClick={addLigne}>+ Ajouter une ligne</Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 space-y-4 overflow-x-hidden">
          {/* En-têtes colonnes */}
          <div className="grid grid-cols-[minmax(240px,1.4fr)_minmax(90px,0.6fr)_minmax(120px,0.8fr)_minmax(140px,0.9fr)_minmax(140px,0.9fr)_minmax(120px,0.8fr)_minmax(160px,1fr)_minmax(120px,0.9fr)] gap-3 text-xs text-muted-foreground px-1">
            <div>Produit</div>
            <div>Qté</div>
            <div>Unité</div>
            <div>Total HT (€)</div>
            <div>PU HT (€)</div>
            <div>PMP</div>
            <div>TVA %</div>
            <div>Zone & Suppr</div>
          </div>

          {fields.map((f, i) => (
            <FactureLigne
              key={f.id}
              value={lignes[i]}
              onChange={(patch) => updateLigne(i, patch)}
              onRemove={() => remove(i)}
              mamaId={mamaId}
              lignes={lignes}
              zones={zones}
            />
          ))}
        </div>
      </section>

      {/* TOTAUX */}
      <div className="rounded-xl border border-border bg-card p-4 grid md:grid-cols-3 gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total HT</span>
          <span className="font-semibold">{totals.total_ht.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">TVA</span>
          <span className="font-semibold">{totals.tva.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total TTC</span>
          <span className="font-semibold">{totals.total_ttc.toFixed(2)}</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end">
        <Button type="submit">Enregistrer</Button>
      </div>
    </form>
  );
}

