import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function FicheLigne({ ligne, products = [], ficheOptions = [], onChange, onRemove }) {
  const prod = products.find((p) => p.id === ligne.produit_id);
  const sf = ficheOptions.find((f) => f.id === ligne.sous_fiche_id);
  const prixUnitaire =
    ligne.type === "produit"
      ? prod?.pmp ?? prod?.dernier_prix ?? null
      : sf?.cout_par_portion ?? null;
  const cout =
    prixUnitaire !== null
      ? Number(prixUnitaire) * Number(ligne.quantite)
      : null;

  return (
    <tr>
      <td>
        <Select
          className="w-full"
          value={ligne.type}
          onChange={(e) => onChange("type", e.target.value)}
        >
          <option value="produit">Produit</option>
          <option value="sous_fiche">Sous-fiche</option>
        </Select>
      </td>
      <td>
        {ligne.type === "produit" ? (
          <Select
            className="w-full"
            value={ligne.produit_id}
            onChange={(e) => onChange("produit_id", e.target.value)}
            required
          >
            <option value="">Sélectionner</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
                {p.unite?.nom ? ` (${p.unite.nom})` : ""}
              </option>
            ))}
          </Select>
        ) : (
          <Select
            className="w-full"
            value={ligne.sous_fiche_id}
            onChange={(e) => onChange("sous_fiche_id", e.target.value)}
            required
          >
            <option value="">Sélectionner</option>
            {ficheOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </Select>
        )}
      </td>
      <td>
        <Input
          type="number"
          className="w-full"
          min={0}
          step="0.01"
          value={ligne.quantite}
          onChange={(e) => onChange("quantite", Number(e.target.value))}
          required
        />
      </td>
      <td>{ligne.type === "produit" ? prod?.unite?.nom || "-" : "portion"}</td>
      <td>
        {prixUnitaire !== null ? Number(prixUnitaire).toFixed(2) : "-"}
      </td>
      <td>{cout !== null ? cout.toFixed(2) : "-"}</td>
      <td>
        <Button size="sm" variant="outline" onClick={onRemove}>
          Suppr.
        </Button>
      </td>
    </tr>
  );
}
