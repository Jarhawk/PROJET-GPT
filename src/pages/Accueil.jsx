import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import useAuth from "@/hooks/useAuth";
// ✅ Étape validée

export default function Accueil() {
  const { session, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session && user) {
      navigate("/dashboard");
    }
  }, [session, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-2xl font-bold">Simplifiez votre gestion F&amp;B</h1>
        <p>
          MamaStock centralise vos fournisseurs, vos produits et vos factures pour un suivi des coûts en toute simplicité.
        </p>
        {!session && (
          <Link
            to="/login"
            className="inline-block bg-mamastock-gold hover:bg-mamastock-gold-hover text-black px-6 py-3 rounded-md transition"
          >
            Se connecter
          </Link>
        )}
      </div>
    </div>
  );
}
