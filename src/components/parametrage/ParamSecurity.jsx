import TwoFactorSetup from "@/components/security/TwoFactorSetup";

export default function ParamSecurity() {
  return (
    <div>
      <h2 className="font-bold text-xl mb-4">Sécurité</h2>
      <TwoFactorSetup />
    </div>
  );
}
