import MamaLogo from "@/components/ui/MamaLogo";

export default function PageIntro() {
  return (
    <div className="space-y-4 text-center">
      <MamaLogo width={120} className="mx-auto" />
      <h1 className="text-4xl font-bold">Simplifiez votre gestion F&B</h1>
      <p className="text-lg opacity-90">
        MamaStock centralise vos fournisseurs, vos produits et vos factures pour
        un suivi des coûts en toute simplicité.
      </p>
    </div>
  );
}
