// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import TwoFactorSetup from "@/components/security/TwoFactorSetup";

export default function ParamSecurity() {
  return (
    <div>
      <h2 className="font-bold text-xl mb-4">Sécurité</h2>
      <TwoFactorSetup />
    </div>
  );
}
