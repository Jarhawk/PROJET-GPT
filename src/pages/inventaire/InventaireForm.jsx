// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from "react";
import { useInventaires } from "@/hooks/useInventaires";
import { useProducts } from "@/hooks/useProducts";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TableContainer from "@/components/ui/TableContainer";
import toast from "react-hot-toast";

export default function InventaireForm() {
  const navigate = useNavigate();
  const { createInventaire, inventaires } = useInventaires();
  const { products } = useProducts();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [zone, setZone] = useState("");
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(false);

  const zoneSuggestions = Array.from(new Set(inventaires.map(i => i.zone).filter(Boolean)));

  const addLine = () => setLignes([...lignes, { product_id: "", quantite: "" }]);
  const updateLine = (idx, field, val) => {
    setLignes(lignes.map((l, i) => (i === idx ? { ...l, [field]: val } : l)));
  };
  const removeLine = idx => setLignes(lignes.filter((_, i) => i !== idx));

  const getProduct = id => products.find(p => p.id === id) || {};
  const getTheo = id => Number(getProduct(id).stock_theorique || 0);
  const getPrice = id => Number(getProduct(id).pmp || getProduct(id).dernier_prix || 0);

  const totalValeur = lignes.reduce((s, l) => s + Number(l.quantite || 0) * getPrice(l.product_id), 0);
  const totalEcart = lignes.reduce((s, l) => s + (Number(l.quantite || 0) - getTheo(l.product_id)) * getPrice(l.product_id), 0);

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
        product_id: l.product_id,
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
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, idx) => {
              const theo = getTheo(l.product_id);
              const price = getPrice(l.product_id);
              const ecart = Number(l.quantite || 0) - theo;
              return (
                <tr key={idx} className="border-b last:border-none">
                  <td className="p-2">
                    <select
                      className="input"
                      value={l.product_id}
                      onChange={e => updateLine(idx, "product_id", e.target.value)}
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
                  <td className="p-2">
                    <Button size="sm" variant="ghost" type="button" onClick={() => removeLine(idx)}>✕</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableContainer>
      <Button type="button" variant="outline" onClick={addLine}>Ajouter produit</Button>

      <div className="text-right font-semibold">
        Valeur totale : {totalValeur.toFixed(2)} € – Écart global : {totalEcart.toFixed(2)} €
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>Enregistrer</Button>
        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={loading}>Annuler</Button>
      </div>
    </form>
  );
}
