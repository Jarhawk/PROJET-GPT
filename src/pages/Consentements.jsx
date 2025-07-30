import { useEffect } from "react";
import useConsentements from "@/hooks/useConsentements";
import RGPDConsentForm from "@/pages/parametrage/RGPDConsentForm.jsx";

export default function Consentements() {
  const { consentements, fetchConsentements } = useConsentements();

  useEffect(() => {
    fetchConsentements();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Historique des consentements</h1>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Donné</th>
          </tr>
        </thead>
        <tbody>
          {consentements.map(c => (
            <tr key={c.id} className="border-b last:border-none">
              <td className="p-2">
                {new Date(c.date_consentement).toLocaleString()}
              </td>
              <td className="p-2">{c.type_consentement || "-"}</td>
              <td className="p-2">{c.consentement ? "Oui" : "Non"}</td>
            </tr>
          ))}
          {consentements.length === 0 && (
            <tr>
              <td colSpan="3" className="p-2 text-center text-gray-500">
                Aucun consentement enregistré
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {consentements.length === 0 && <RGPDConsentForm />}
    </div>
  );
}
