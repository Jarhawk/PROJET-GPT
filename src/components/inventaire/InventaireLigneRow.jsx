// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Input } from "@/components/ui/input";

export default function InventaireLigneRow({ ligne, onChange }) {
  const theo = Number(ligne.stock_theorique || 0);
  const qty = Number(ligne.quantite_reelle || 0);
  const ecart = qty - theo;
  const valeurEcart = ecart * Number(ligne.pmp || 0);

  return (
    <tr className="border-b last:border-none">
      <td className="p-2 text-left">{ligne.nom}</td>
      <td className="p-2">{ligne.unite}</td>
      <td className="p-2">
        <Input
          type="number"
          value={ligne.quantite_reelle}
          onChange={e => onChange({ ...ligne, quantite_reelle: e.target.value })}
          className="w-24 text-center"
        />
      </td>
      <td className="p-2">{theo}</td>
      <td className={`p-2 ${ecart < 0 ? 'text-red-600' : ecart > 0 ? 'text-green-600' : ''}`}>{ecart.toFixed(2)}</td>
      <td className={`p-2 ${valeurEcart < 0 ? 'text-red-600' : valeurEcart > 0 ? 'text-green-600' : ''}`}>{valeurEcart.toFixed(2)}</td>
    </tr>
  );
}
