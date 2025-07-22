// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import { useInventaires } from "@/hooks/useInventaires";
import { useProduitsInventaire } from "@/hooks/useProduitsInventaire";
import { useInventaireZones } from "@/hooks/useInventaireZones";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Input } from "@/components/ui/input";
import TableContainer from "@/components/ui/TableContainer";
import toast from "react-hot-toast";

export default function InventaireForm() {
  const navigate = useNavigate();
  const { createInventaire } = useInventaires();
  const { produits, fetchProduits } = useProduitsInventaire();
  const { zones, getZones } = useInventaireZones();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [zone, setZone] = useState("");
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(false);

  const zoneSuggestions = zones.map(z => z.nom);
  const [familleFilter, setFamilleFilter] = useState("");
  const [search, setSearch] = useState("");

  const products = produits;

  useEffect(() => {
    getZones();
  }, [getZones]);

  useEffect(() => {
    // Le filtrage des produits se fait par famille et terme de recherche
    // La zone n'est plus utilisée côté front pour restreindre la liste
    fetchProduits({ famille: familleFilter, search });
  }, [familleFilter, search, fetchProduits]);

  const addLine = () => setLignes([...lignes, { produit_id: "", quantite: "" }]);
  const updateLine = (idx, field, val) => {
    setLignes(lignes.map((l, i) => (i === idx ? { ...l, [field]: val } : l)));
  };
  const removeLine = idx => setLignes(lignes.filter((_, i) => i !== idx));

  const getProduct = id => products.find(p => p.id === id) || {};
  const getTheo = id => Number(getProduct(id).stock_theorique || 0);
  const getPrice = id => Number(getProduct(id).pmp || 0);

  const totalValeur = lignes.reduce((s, l) => s + Number(l.quantite || 0) * getPrice(l.produit_id), 0);
  const totalEcart = lignes.reduce((s, l) => s + (Number(l.quantite || 0) - getTheo(l.produit_id)) * getPrice(l.produit_id), 0);

  const handleSubmit = async e => {
    e.preventDefault();
    if (loading) return;
    if (!lignes.length) {
      toast.error("Ajoutez au moins un produit");
      return;
    }
    setLoading(true);
    const payload = {
      date,
      zone,
      lignes: lignes.map(l => ({
        produit_id: l.produit_id,
        quantite: Number(l.quantite || 0),
      })),
    };
    try {
      const created = await createInventaire(payload);
      if (created) {
        toast.success("Inventaire enregistré !");
        navigate("/inventaire");
      }
    } catch (err) {
      toast.error(err?.message || "Erreur à l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Nouvel inventaire</h1>

      <div className="flex gap-4">
        <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
        <input
          list="zones"
          className="input"
          placeholder="Zone"
          value={zone}
          onChange={e => setZone(e.target.value)}
        />
        <datalist id="zones">
          {zoneSuggestions.map(z => (
            <option key={z} value={z} />
          ))}
        </datalist>
      </div>
      <div className="flex gap-4">
        <input
          className="input flex-1"
          placeholder="Recherche produit"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          list="familles"
          className="input"
          placeholder="Famille"
          value={familleFilter}
          onChange={e => setFamilleFilter(e.target.value)}
        />
        <datalist id="familles">
          {Array.from(new Set(products.map(p => p.famille).filter(Boolean))).map(f => (
            <option key={f} value={f} />
          ))}
        </datalist>
      </div>

      <TableContainer>
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr>
              <th className="p-2">Produit</th>
              <th className="p-2">Quantité</th>
              <th className="p-2">Théorique</th>
              <th className="p-2">Prix</th>
              <th className="p-2">Écart</th>
              <th className="p-2">Valeur écart</th>
              <th className="p-2">Conso mens.</th>
              <th className="p-2">Réquisition</th>
              <th className="p-2">Écart req.</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, idx) => {
              const theo = getTheo(l.produit_id);
              const price = getPrice(l.produit_id);
              const ecart = Number(l.quantite || 0) - theo;
              const conso = Number(getProduct(l.produit_id).conso_calculee || 0);
              const requisition = zone === 'Boisson' ? Number(getProduct(l.produit_id).requisition_mensuelle || 0) : 0;
              const ecartReq = zone === 'Boisson' ? requisition - conso : 0;
              return (
                <tr key={idx} className="border-b last:border-none">
                  <td className="p-2">
                    <select
                      className="input"
                      value={l.produit_id}
                      onChange={e => updateLine(idx, "produit_id", e.target.value)}
                    >
                      <option value="">-- produit --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.nom}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="input w-24"
                    value={l.quantite}
                    onChange={e => updateLine(idx, "quantite", e.target.value)}
                    />
                  </td>
                  <td className="p-2">{theo}</td>
                  <td className="p-2">{price}</td>
                  <td className={`p-2 ${ecart < 0 ? 'text-red-600' : ecart > 0 ? 'text-green-600' : ''}`}>{ecart.toFixed(2)}</td>
                  <td className={`p-2 ${ecart * price < 0 ? 'text-red-600' : ecart * price > 0 ? 'text-green-600' : ''}`}>{(ecart * price).toFixed(2)}</td>
                  <td className="p-2">{conso.toFixed(2)}</td>
                  <td className="p-2">{zone === 'Boisson' ? requisition.toFixed(2) : '-'}</td>
                  <td className="p-2">{zone === 'Boisson' ? ecartReq.toFixed(2) : '-'}</td>
                  <td className="p-2">
                    <Button size="sm" variant="ghost" type="button" onClick={() => removeLine(idx)}>✕</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableContainer>
      <Button type="button" onClick={addLine} className="mt-2">Ajouter produit</Button>

      <div className="text-right font-semibold">
        Valeur totale : {totalValeur.toFixed(2)} € – Écart global : {totalEcart.toFixed(2)} €
      </div>

      <div className="flex gap-4">
        <PrimaryButton type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? "Enregistrement..." : "Enregistrer"}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => navigate(-1)} disabled={loading}>Annuler</SecondaryButton>
      </div>
    </form>
  );
}
