import { Link } from "react-router-dom";
import MamaLogo from "@/components/ui/MamaLogo";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f1c2e] via-[#232a34] to-[#bfa14d] text-white text-center p-8">
      <MamaLogo width={120} className="mb-8" />
      <h1 className="text-4xl font-bold mb-4">Simplifiez votre gestion F&B</h1>
      <p className="max-w-xl mb-8 text-lg opacity-90">
        MamaStock centralise vos fournisseurs, vos produits et vos factures pour
        un suivi des coûts en toute simplicité.
      </p>
      <div className="flex gap-4 mb-16">
        <Link
          to="/login"
          className="px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 transition"
        >
          Se connecter
        </Link>
        <Link
          to="/signup"
          className="px-6 py-3 rounded-xl bg-mamastockGold hover:bg-mamastockGoldHover text-mamastockBg transition"
        >
          Créer un compte
        </Link>
      </div>
      <section className="max-w-2xl">
        <h2 className="text-2xl font-semibold mb-2">Pourquoi MamaStock ?</h2>
        <p className="mb-6">
          Réduisez les pertes, maîtrisez vos marges et gagnez du temps grâce à un
          outil tout-en-un pensé pour la restauration.
        </p>
        <h2 className="text-2xl font-semibold mb-2">Fonctionnalités clés</h2>
        <ul className="mb-6 list-disc list-inside text-left">
          <li>Gestion des produits et des fournisseurs</li>
          <li>Suivi des coûts et reporting détaillé</li>
          <li>Processus d'inventaire simplifié</li>
        </ul>
        <h2 className="text-2xl font-semibold mb-2">Ils nous font confiance</h2>
        <p className="opacity-80">Plusieurs groupes de restaurants utilisent déjà MamaStock au quotidien.</p>
      </section>
    </div>
  );
}
