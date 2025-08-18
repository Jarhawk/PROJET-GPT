// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import supabase from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useFournisseursAutocomplete } from '@/hooks/useFournisseursAutocomplete';
import { useFactureForm } from '@/hooks/useFactureForm';
import GlassCard from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import AutoCompleteField from '@/components/ui/AutoCompleteField';
import { Button } from '@/components/ui/button';
import FactureLigne from '@/components/FactureLigne';
import { toast } from 'sonner';
import { FACTURE_STATUTS } from '@/constants/factures';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Loader2 } from 'lucide-react';
import { useInvoice, useSaveFacture } from '@/hooks/useInvoice';

export function toLabel(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return toLabel(v[0]);
  if (typeof v === 'object')
    return (
      v.nom ??
      v.name ??
      v.label ??
      v.code ??
      v.abbr ??
      v.abreviation ??
      v.symbol ??
      v.symbole ??
      v.id ??
      ''
    ) + '';
  return String(v);
}

export function mapDbLineToUI(l) {
  const q = parseFloat(l.quantite) || 0;
  const pu = parseFloat(l.pu ?? l.prix_unitaire) || 0;
  return {
    id: l.id,
    produit: l.produit ?? { id: l.produit_id },
    produit_id: l.produit_id,
    quantite: String(q),
    unite: l.unite ?? l.produit?.unite_achat ?? l.produit?.unite ?? '',
    total_ht:
      l.total_ht != null ? String(l.total_ht) : (q * pu).toFixed(2),
    pu: pu.toFixed(2),
    pmp: l.pmp ?? l.produit?.pmp ?? 0,
    tva: l.tva ?? l.produit?.tva_id ?? null,
    zone_id: l.zone_id ?? l.produit?.zone_stock_id ?? '',
    position: l.position ?? 0,
    note: l.note ?? '',
    actif: l.actif ?? true,
    manuallyEdited: false,
  };
}

export default function FactureForm({
  facture = null,
  lignes: lignesInit = [],
  onClose,
  onSaved,
}) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const submitLabel = isEdit ? 'Modifier' : 'Enregistrer';
  const { userData } = useAuth();
  const mamaId = userData?.mama_id;
  const saveFacture = useSaveFacture(mamaId);
  const { results: fournisseurOptions, searchFournisseurs } =
    useFournisseursAutocomplete();
  const formRef = useRef(null);
  const factureId = id || facture?.id;
  const { data: invoiceData, isLoading: loadingFacture } = useInvoice(
    factureId,
    { enabled: Boolean(factureId) }
  );

  const [date, setDate] = useState(
    facture?.date_facture || new Date().toISOString().slice(0, 10)
  );
  const [fournisseur_id, setFournisseurId] = useState(
    facture?.fournisseur_id || ''
  );
  const [fournisseurNom, setFournisseurNom] = useState(
    facture?.fournisseur?.nom || ''
  );
  const [isBonLivraison, setIsBonLivraison] = useState(
    Boolean(facture?.bon_livraison)
  );
  const [numero, setNumero] = useState(facture?.numero || '');
  const [numeroUsed, setNumeroUsed] = useState(false);
  const [statut, setStatut] = useState(facture?.statut || 'Brouillon');
  const defaultLigne = {
    id: null,
    produit: { id: '' },
    produit_id: '',
    quantite: '1',
    unite: '',
    total_ht: '0',
    pu: '0',
    pmp: 0,
    tva: 20,
    zone_id: '',
    position: 0,
    note: '',
    actif: true,
    manuallyEdited: false,
  };
  const [lignes, setLignes] = useState(
    lignesInit.length ? lignesInit : [defaultLigne]
  );
  const [lineKeys, setLineKeys] = useState(
    (lignesInit.length ? lignesInit : [defaultLigne]).map(() => 0)
  );
  const [activeLine, setActiveLine] = useState(null);
  useEffect(() => {
    if (lignesInit.length) {
      setLignes(lignesInit);
      setLineKeys(lignesInit.map(() => 0));
    }
  }, [lignesInit]);
  const [totalHt, setTotalHt] = useState(
    facture?.total_ht !== undefined && facture?.total_ht !== null
      ? String(facture.total_ht)
      : ''
  );
  const { autoHt, autoTva, autoTotal } = useFactureForm(lignes);
  const ecart = (parseFloat(String(totalHt).replace(',', '.')) || 0) - autoHt;
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (invoiceData?.facture) {
      const f = invoiceData.facture;
      setDate(f.date_facture || new Date().toISOString().slice(0, 10));
      setFournisseurId(f.fournisseur_id || '');
      setNumero(f.numero || '');
      setStatut(f.statut || 'Brouillon');
      setIsBonLivraison(
        Boolean(f.bon_livraison) || (f.numero || '').startsWith('BL')
      );
      setTotalHt(
        f?.total_ht !== undefined && f?.total_ht !== null
          ? String(f.total_ht)
          : ''
      );
      setFournisseurNom(f.fournisseur?.nom || '');
      if (f.fournisseur?.nom) searchFournisseurs(f.fournisseur.nom);
      const mapped = (invoiceData.lignes || []).map(mapDbLineToUI);
      setLignes(mapped.length ? mapped : [defaultLigne]);
      setLineKeys(mapped.length ? mapped.map(() => 0) : [0]);
    }
  }, [invoiceData]);

  useEffect(() => {
    if (isBonLivraison && !numero.startsWith('BL')) {
      setNumero('BL');
    } else if (!isBonLivraison && numero.startsWith('BL')) {
      setNumero('');
    }
  }, [isBonLivraison]);

  useEffect(() => {
    setIsBonLivraison(numero.startsWith('BL'));
  }, [numero]);

  useEffect(() => {
    if (!factureId) {
      searchFournisseurs('');
    }
  }, [factureId, searchFournisseurs]);

  useEffect(() => {
    const checkNumero = async () => {
      if (!numero) {
        setNumeroUsed(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('factures')
          .select('id')
          .eq('mama_id', mamaId)
          .eq('numero', numero)
          .neq('id', factureId || 0)
          .limit(1)
          .maybeSingle();
        setNumeroUsed(!!data);
      } catch (error) {
        console.error(error);
      }
    };
    checkNumero();
  }, [numero, mamaId, factureId]);

  const ecartClass = Math.abs(ecart) > 0.01 ? 'text-green-500' : '';

  const parseNum = (v) => parseFloat(String(v).replace(',', '.')) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numeroUsed) return toast.error('Référence déjà utilisée');
    if (!date || !fournisseur_id) {
      toast.error('Champs requis manquants !');
      formRef.current?.querySelector(':invalid')?.focus();
      return;
    }
    if (!mamaId) {
      toast.error('Session invalide (mama_id manquant).');
      return;
    }

    const payload = {
      facture: {
        id: factureId,
        numero,
        date_facture: date,
        fournisseur_id,
        etat: statut,
      },
      lignes: [],
      apply_stock: statut !== 'Brouillon',
    };

    for (let i = 0; i < lignes.length; i++) {
      const ligne = lignes[i];
      const quantite = parseNum(ligne.quantite);
      const prixSaisi = parseNum(ligne.pu);
      const totalSaisi = parseNum(ligne.total_ht);
      if (!ligne.produit_id || quantite <= 0 || (!prixSaisi && !totalSaisi)) {
        toast.error('Ligne de produit invalide');
        return;
      }
      let puFinal = prixSaisi || (quantite ? totalSaisi / quantite : 0);
      puFinal = isFinite(puFinal) ? puFinal : 0;
      payload.lignes.push({
        id: ligne.id,
        produit_id: ligne.produit_id ?? ligne.produit?.id ?? '',
        quantite,
        pu_ht: puFinal,
        tva: ligne.tva ?? null,
      });
    }

    try {
      setSaving(true);
      const data = await saveFacture.mutateAsync(payload);
      onSaved?.(data?.facture?.id);
      if (data?.facture?.id) {
        navigate(`/factures/${data.facture.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    const hasContent =
      statut === 'Brouillon' &&
      (fournisseurNom ||
        numero ||
        totalHt ||
        isBonLivraison ||
        lignes.some(
          (l) =>
            l.produit_id ||
            l.produit?.nom ||
            parseNum(l.quantite) !== 1 ||
            parseNum(l.total_ht) !== 0 ||
            l.tva !== 20 ||
            l.zone_id
        ));
    if (hasContent && !window.confirm('Fermer sans enregistrer ?')) return;
    onClose?.();
  };

  if (loadingFacture) return <LoadingSpinner message="Chargement..." />;

  return (
    <GlassCard
      width="w-full"
      title={facture ? 'Modifier la facture' : 'Ajouter une facture'}
    >
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.preventDefault();
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        data-lpignore="true"
        data-form-type="other"
        enterKeyHint="search"
        className="space-y-6"
      >
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col lg:col-span-2">
            <div className="flex items-center gap-2 text-sm mb-1">
              <Checkbox
                checked={isBonLivraison}
                onChange={(e) => setIsBonLivraison(e.target.checked)}
              />
              <span>Bon de livraison</span>
            </div>
            <label className="text-sm mb-1">Référence</label>
            <Input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Référence facture ou bon de livraison"
              className={numeroUsed ? 'border-red-500' : ''}
              required
            />
            {numeroUsed && (
              <p className="text-xs text-red-500">Référence déjà existante</p>
            )}
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">Date *</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">État</label>
            <Select value={statut} onChange={(e) => setStatut(e.target.value)}>
              {FACTURE_STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">Total HT</label>
            <div className="relative">
              <Input
                type="text"
                value={totalHt}
                onChange={(e) => setTotalHt(e.target.value.replace(',', '.'))}
                onBlur={() =>
                  setTotalHt(
                    (
                      parseFloat(String(totalHt).replace(',', '.')) || 0
                    ).toFixed(2)
                  )
                }
                className="font-bold pr-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">
                €
              </span>
            </div>
          </div>
          <div className="flex flex-col lg:col-span-2">
            <label className="text-sm mb-1">Fournisseur *</label>
            <AutoCompleteField
              value={fournisseurNom}
              onChange={(obj) => {
                const val = obj?.nom || '';
                setFournisseurNom(val);
                setFournisseurId(obj?.id || '');
                if (!obj?.id && val.length >= 2) searchFournisseurs(val);
              }}
              options={fournisseurOptions}
              required
            />
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-2">Lignes produits</h3>
          <div className="mt-4 overflow-x-hidden">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-70">
                <div className="basis-[20%] shrink-0">Produit</div>
                <div className="basis-[10%] shrink-0 text-right">Quantité</div>
                <div className="basis-[10%] shrink-0">Unité</div>
                <div className="basis-[10%] shrink-0 text-right">Total HT</div>
                <div className="basis-[10%] shrink-0 text-right">PU</div>
                <div className="basis-[10%] shrink-0 text-right">PMP</div>
                <div className="basis-[10%] shrink-0">TVA</div>
                <div className="basis-[15%] shrink-0">Zone</div>
                <div className="basis-[5%] shrink-0 text-center">Actions</div>
              </div>
              {lignes.map((l, idx) => (
                <FactureLigne
                  key={`${idx}-${lineKeys[idx]}`}
                  index={idx}
                  ligne={l}
                  lineKey={lineKeys[idx]}
                  onProduitFocus={(i) => {
                    setLineKeys((ks) => {
                      if (activeLine == null || activeLine === i) return ks;
                      const arr = [...ks];
                      arr[activeLine] = (arr[activeLine] || 0) + 1;
                      return arr;
                    });
                    setActiveLine(i);
                  }}
                  onChange={(ligne) => {
                    setLignes((ls) => {
                      const newLs = ls.map((it, i) => (i === idx ? ligne : it));
                      const ids = newLs.map((li) => li.produit_id).filter(Boolean);
                      const hasDup = ids.some((id, i) => ids.indexOf(id) !== i);
                      if (hasDup) toast.error('Produit déjà ajouté');
                      return newLs;
                    });
                  }}
                  onRemove={(i) => {
                    setLignes((ls) => ls.filter((_, j) => j !== i));
                    setLineKeys((ks) => ks.filter((_, j) => j !== i));
                  }}
                />
              ))}
            </div>
          </div>
          <Button
            type="button"
            className="mt-4"
            onClick={() => {
              setLignes((ls) => [...ls, { ...defaultLigne }]);
              setLineKeys((ks) => [...ks, 0]);
            }}
          >
            Ajouter ligne
          </Button>
        </section>

        <section className="p-3 mt-4 bg-white/10 border border-white/20 rounded">
          <div className="flex flex-wrap gap-4">
            <span>
              Total HT : {autoHt.toFixed(2)} € – TVA : {autoTva.toFixed(2)} € –
              TTC : {autoTotal.toFixed(2)} €
            </span>
            <span className={`font-bold ${ecartClass}`}>
              Écart HT : {ecart.toFixed(2)} €
            </span>
          </div>
        </section>

        <div className="flex gap-2 mt-4">
          <Button
            type="submit"
            variant="primary"
            className="min-w-[120px]"
            disabled={numeroUsed || saving}
            aria-busy={saving}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Patientez…
              </span>
            ) : (
              submitLabel
            )}
          </Button>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Fermer
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
