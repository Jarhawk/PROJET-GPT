// src/pages/auth/Unauthorized.jsx
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-red-600 text-center px-6">
      <h1 className="text-3xl font-bold mb-4">🚫 Accès refusé</h1>
      <p className="text-lg mb-6">
        Vous n'avez pas les droits nécessaires pour accéder à cette page.
      </p>
      <button
        onClick={() => navigate("/")}
        className="bg-[#bfa14d] hover:bg-[#a98b39] text-white font-semibold py-2 px-4 rounded"
      >
        Retour à l'accueil
      </button>
    </div>
  );
}
