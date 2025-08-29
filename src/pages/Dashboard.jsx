// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite.
import GadgetTopFournisseurs from '@/components/gadgets/GadgetTopFournisseurs';
import GadgetProduitsUtilises from '@/components/gadgets/GadgetProduitsUtilises';
import GadgetBudgetMensuel from '@/components/gadgets/GadgetBudgetMensuel';
import GadgetAlerteStockFaible from '@/components/gadgets/GadgetAlerteStockFaible';
import GadgetEvolutionAchats from '@/components/gadgets/GadgetEvolutionAchats';
import GadgetTachesUrgentes from '@/components/gadgets/GadgetTachesUrgentes';
import GadgetConsoMoyenne from '@/components/gadgets/GadgetConsoMoyenne';
import GadgetDerniersAcces from '@/components/gadgets/GadgetDerniersAcces';

export default function Dashboard() {
  const gadgets = [
    GadgetBudgetMensuel,
    GadgetTopFournisseurs,
    GadgetProduitsUtilises,
    GadgetAlerteStockFaible,
    GadgetEvolutionAchats,
    GadgetTachesUrgentes,
    GadgetConsoMoyenne,
    GadgetDerniersAcces,
  ];
  const gadgetList = Array.isArray(gadgets) ? gadgets : [];
  const rendered = [];
  for (let i = 0; i < gadgetList.length; i++) {
    const Component = gadgetList[i];
    rendered.push(<Component key={i} />);
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {rendered}
    </div>
  );
}
