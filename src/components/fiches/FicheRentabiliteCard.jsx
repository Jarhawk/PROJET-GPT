// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import Card from '@/components/ui/Card'

export default function FicheRentabiliteCard({ fiche }) {
  const {
    nom,
    cout_portion,
    prix_vente,
    ventes,
    marge,
    score_calc,
    classement,
  } = fiche
  return (
    <Card>
      <div className="font-semibold mb-1">{nom}</div>
      <div className="text-sm">Coût: {cout_portion?.toFixed(2)} €</div>
      <div className="text-sm">Prix: {prix_vente?.toFixed(2)} €</div>
      <div className="text-sm">Ventes: {ventes}</div>
      <div className="text-sm">Marge: {marge?.toFixed(1)}%</div>
      <div className="text-sm">Score: {score_calc}</div>
      <div className="text-xs italic">{classement}</div>
    </Card>
  )
}
