import React from 'react';
import GadgetTopFournisseurs from '../components/gadgets/GadgetTopFournisseurs.jsx';
import GadgetBudgetMensuel from '../components/gadgets/GadgetBudgetMensuel.jsx';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        <GadgetBudgetMensuel />
        <GadgetTopFournisseurs />
        {/* Ajoute ici les autres gadgets existants */}
      </div>
    </div>
  );
}
