// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useBonsLivraison } from '@/hooks/useBonsLivraison';
import { useProduitsAutocomplete } from '@/hooks/useProduitsAutocomplete';
import { useFournisseursAutocomplete } from '@/hooks/useFournisseursAutocomplete';
import AutoCompleteField from '@/components/ui/AutoCompleteField';
import { Button } from '@/components/ui/button';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';
import { Input } from '@/components/ui/input';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Unauthorized from '@/pages/auth/Unauthorized';

export default function BLForm({ bon, fournisseurs = [], onClose }) {
  const { insertBonLivraison, updateBonLivraison } = useBonsLivraison();
  const { results: produitOptions, searchProduits } = useProduitsAutocomplete();
  const { options: fournisseurOptions } = useFournisseursAutocomplete({ term: fournisseurName });
  const { hasAccess, loading: authLoading } = useAuth();
  const canEdit = hasAccess('bons_livraison', 'peut_modifier');

  const initialLines = [];
  if (Array.isArray(bon?.lignes)) {
    for (const l of bon.lignes) {
      initialLines.push({ ...l, produit_nom: l.produit?.nom || '' });
    }
  } else {
    initialLines.push({
      produit_id: '',
      produit_nom: '',
      quantite_recue: 1,
      prix_unitaire: 0,
      tva: 20,
    });
  }

  const [date_reception, setDateReception] = useState(bon?.date_reception || '');
  const [fournisseur_id, setFournisseurId] = useState(bon?.fournisseur_id || '');
  const [fournisseurName, setFournisseurName] = useState('');
  const [numero_bl, setNumero] = useState(bon?.numero_bl || '');
  const [commentaire, setCommentaire] = useState(bon?.commentaire || '');
  const [lignes, setLignes] = useState(initialLines);
  const [loading, setLoading] = useState(false);

  const fournisseurList = Array.isArray(fournisseurs) ? fournisseurs : [];

  useEffect(() => {
    if (bon?.fournisseur_id && fournisseurList.length) {
      let found = null;
      for (let i = 0; i < fournisseurList.length; i++) {
        const s = fournisseurList[i];
        if (s.id === bon.fournisseur_id) {
          found = s;
          break;
        }
      }
      setFournisseurName(found?.nom || '');
    }
  }, [bon?.fournisseur_id, fournisseurList]);

  useEffect(() => {
    // fetching handled by hook
  }, [fournisseurName]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;
  if (!canEdit) return <Unauthorized />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date_reception || !fournisseur_id)
      return toast.error('Date et fournisseur requis');
    setLoading(true);
    const payload = {
      numero_bl,
      date_reception,
      fournisseur_id,
      commentaire,
      lignes,
    };
    try {
      if (bon?.id) {
        await updateBonLivraison(bon.id, payload);
        toast.success('BL modifié');
      } else {
        const { error } = await insertBonLivraison(payload);
        if (error) throw error;
        toast.success('BL ajouté');
      }
      onClose?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fournisseurOpts = Array.isArray(fournisseurOptions)
    ? fournisseurOptions
    : [];
  const produitOpts = Array.isArray(produitOptions) ? produitOptions : [];
  const lignesList = Array.isArray(lignes) ? lignes : [];

  const fournisseurNodes = [];
  for (let i = 0; i < fournisseurOpts.length; i++) {
    const f = fournisseurOpts[i];
    fournisseurNodes.push(
      <option key={f.id} value={f.nom}>
        {f.nom}
      </option>
    );
  }

  const produitOptsList = [];
  for (let i = 0; i < produitOpts.length; i++) {
    const p = produitOpts[i];
    produitOptsList.push({ id: p.id, nom: p.nom });
  }

  const ligneRows = [];
  for (let idx = 0; idx < lignesList.length; idx++) {
    const l = lignesList[idx];
    ligneRows.push(
      <tr key={idx}>
        <td className="min-w-[150px]">
          <AutoCompleteField
            label=""
            value={l.produit_id}
            onChange={(obj) => {
              setLignes((ls) => {
                const arr = Array.isArray(ls) ? [...ls] : [];
                for (let i = 0; i < arr.length; i++) {
                  if (i === idx) {
                    arr[i] = {
                      ...arr[i],
                      produit_nom: obj?.nom || '',
                      produit_id: obj?.id || '',
                    };
                    break;
                  }
                }
                return arr;
              });
              if ((obj?.nom || '').length >= 2) searchProduits(obj.nom);
            }}
            options={produitOptsList}
          />
        </td>
        <td>
          <input
            type="number"
            className="form-input"
            value={l.quantite_recue}
            onChange={(e) =>
              setLignes((ls) => {
                const arr = Array.isArray(ls) ? [...ls] : [];
                for (let i = 0; i < arr.length; i++) {
                  if (i === idx) {
                    arr[i] = {
                      ...arr[i],
                      quantite_recue: Number(e.target.value),
                    };
                    break;
                  }
                }
                return arr;
              })
            }
          />
        </td>
        <td>
          <input
            type="number"
            className="form-input"
            value={l.prix_unitaire}
            onChange={(e) =>
              setLignes((ls) => {
                const arr = Array.isArray(ls) ? [...ls] : [];
                for (let i = 0; i < arr.length; i++) {
                  if (i === idx) {
                    arr[i] = {
                      ...arr[i],
                      prix_unitaire: Number(e.target.value),
                    };
                    break;
                  }
                }
                return arr;
              })
            }
          />
        </td>
        <td>
          <input
            type="number"
            className="form-input"
            value={l.tva}
            onChange={(e) =>
              setLignes((ls) => {
                const arr = Array.isArray(ls) ? [...ls] : [];
                for (let i = 0; i < arr.length; i++) {
                  if (i === idx) {
                    arr[i] = { ...arr[i], tva: Number(e.target.value) };
                    break;
                  }
                }
                return arr;
              })
            }
          />
        </td>
        <td>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setLignes((ls) => {
                const arr = [];
                if (Array.isArray(ls)) {
                  for (let i = 0; i < ls.length; i++) {
                    if (i !== idx) arr.push(ls[i]);
                  }
                }
                return arr;
              })
            }
          >
            X
          </Button>
        </td>
      </tr>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <GlassCard
        title={bon ? 'Modifier BL' : 'Nouveau BL'}
        className="p-6 min-w-[400px] space-y-2"
      >
        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="block text-sm mb-1">Numéro</label>
          <Input
            value={numero_bl}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Numéro"
          />
          <label className="block text-sm mb-1">Date de réception *</label>
          <Input
            type="date"
            value={date_reception}
            onChange={(e) => setDateReception(e.target.value)}
            required
          />
          <label className="block text-sm mb-1">Fournisseur *</label>
          <Input
            list="fournisseurs-list"
            value={fournisseurName}
            onChange={(e) => {
              const val = e.target.value;
              setFournisseurName(val);
              let found = null;
              for (let i = 0; i < fournisseurOpts.length; i++) {
                const f = fournisseurOpts[i];
                if (f.nom === val) {
                  found = f;
                  break;
                }
              }
              setFournisseurId(found ? found.id : '');
            }}
            placeholder="Fournisseur"
            required
          />
          <datalist id="fournisseurs-list">{fournisseurNodes}</datalist>
          <label className="block text-sm mb-1">Commentaire</label>
          <textarea
            className="form-textarea w-full"
            placeholder="Commentaire"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
          <table className="w-full text-sm mb-2">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Qté</th>
                <th>PU</th>
                <th>TVA</th>
                <th></th>
              </tr>
            </thead>
            <tbody>{ligneRows}</tbody>
          </table>
          <Button
            type="button"
            onClick={() =>
              setLignes((ls) => {
                const arr = Array.isArray(ls) ? [...ls] : [];
                arr.push({
                  produit_id: '',
                  produit_nom: '',
                  quantite_recue: 1,
                  prix_unitaire: 0,
                  tva: 20,
                });
                return arr;
              })
            }
            className="mt-2"
          >
            Ajouter ligne
          </Button>
          <div className="flex gap-2 justify-end mt-2">
            <PrimaryButton
              type="submit"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? 'Enregistrement...' : bon ? 'Modifier' : 'Ajouter'}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={onClose}>
              Annuler
            </SecondaryButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
