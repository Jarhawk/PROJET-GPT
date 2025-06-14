import { Tabs } from "@/components/ui/tabs";
import ParamFamilles from "@/components/parametrage/ParamFamilles";
import ParamUnites from "@/components/parametrage/ParamUnites";
import ParamRoles from "@/components/parametrage/ParamRoles";
import ParamAccess from "@/components/parametrage/ParamAccess";
import ParamMama from "@/components/parametrage/ParamMama";
import ParamCostCenters from "@/components/parametrage/ParamCostCenters";

export default function Parametrage() {
  return (
    <div className="p-6 container mx-auto">
      <Tabs
        tabs={[
          { name: "Familles", content: <ParamFamilles /> },
          { name: "Unités", content: <ParamUnites /> },
          { name: "Rôles", content: <ParamRoles /> },
          { name: "Accès", content: <ParamAccess /> },
          { name: "Cost centers", content: <ParamCostCenters /> },
          { name: "Établissement", content: <ParamMama /> },
        ]}
      />
    </div>
  );
}
