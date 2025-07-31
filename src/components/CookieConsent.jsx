// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import PrimaryButton from "@/components/ui/PrimaryButton";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookieConsent", "declined");
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 bg-black/80 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-50">
      <p className="text-sm">
        Nous utilisons des cookies pour améliorer votre expérience et réaliser des statistiques d'utilisation.
      </p>
      <div className="flex gap-2">
        <Button onClick={decline} className="w-auto px-4 py-2" aria-label="Refuser">
          Refuser
        </Button>
        <PrimaryButton onClick={accept} className="w-auto px-4 py-2" aria-label="Accepter">
          Accepter
        </PrimaryButton>
      </div>
    </div>
  );
}
