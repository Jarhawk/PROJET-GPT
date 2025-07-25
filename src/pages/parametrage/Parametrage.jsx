// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { Tabs } from "@/components/ui/tabs";
import ParamFamilles from "@/components/parametrage/ParamFamilles";
import ParamUnites from "@/components/parametrage/ParamUnites";
import ParamRoles from "@/components/parametrage/ParamRoles";
import ParamAccess from "@/components/parametrage/ParamAccess";
import ParamMama from "@/components/parametrage/ParamMama";
import ParamCostCenters from "@/components/parametrage/ParamCostCenters";
import ParamSecurity from "@/components/parametrage/ParamSecurity";
import useAuth from "@/hooks/useAuth";

export default function Parametrage() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return (
    <div className="p-6 container mx-auto">
      <Tabs
        tabs={[
          { name: "Familles", content: <ParamFamilles /> },
          { name: "Unités", content: <ParamUnites /> },
          { name: "Rôles", content: <ParamRoles /> },
          { name: "Accès", content: <ParamAccess /> },
          { name: "Centres de coûts", content: <ParamCostCenters /> }, // ✅ Correction Codex
          { name: "Établissement", content: <ParamMama /> },
          { name: "Sécurité", content: <ParamSecurity /> },
        ]}
      />
    </div>
  );
}
