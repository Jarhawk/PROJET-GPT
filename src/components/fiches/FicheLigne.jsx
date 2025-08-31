import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function FicheLigne({ ligne, products = [], ficheOptions = [], onChange, onRemove }) {
  const productList = Array.isArray(products) ? products : [];
  const ficheList = Array.isArray(ficheOptions) ? ficheOptions : [];
    let prod = null;
    for (const p of productList) {
      if (p.id === ligne.produit_id) { prod = p; break; }
    }
    let sf = null;
    for (const f of ficheList) {
      if (f.id === ligne.sous_fiche_id) { sf = f; break; }
    }
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
              {(() => {
                const opts = [];
                for (const p of productList) {
                  opts.push(
                    <option key={p.id} value={p.id}>
                      {p.nom}
                      {p.unite?.nom ? ` (${p.unite.nom})` : ""}
                    </option>
                  );
                }
                return opts;
              })()}
          </Select>
        ) : (
          <Select
            className="w-full"
            value={ligne.sous_fiche_id}
            onChange={(e) => onChange("sous_fiche_id", e.target.value)}
            required
          >
              <option value="">Sélectionner</option>
              {(() => {
                const opts = [];
                for (const f of ficheList) {
                  opts.push(
                    <option key={f.id} value={f.id}>
                      {f.nom}
                    </option>
                  );
                }
                return opts;
              })()}
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
