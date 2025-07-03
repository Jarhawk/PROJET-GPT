// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useEffect } from "react";

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
        <button onClick={decline} className="px-4 py-1 rounded bg-white/20 hover:bg-white/30">
          Refuser
        </button>
        <button onClick={accept} className="px-4 py-1 rounded bg-mamastockGold text-black hover:bg-mamastockGoldHover">
          Accepter
        </button>
      </div>
    </div>
  );
}
