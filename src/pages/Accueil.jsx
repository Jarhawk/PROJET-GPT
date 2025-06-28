import { motion as Motion } from "framer-motion";
import logoMamaStock from "@/assets/logo-mamastock.png";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import Footer from "@/components/Footer";

export default function Accueil() {
  const { session, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session && user) {
      navigate("/dashboard");
    }
  }, [session, user, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-[#1E3A8A] text-white relative">
      <div className="flex-grow flex flex-col items-center justify-center px-4">
        <Motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-3xl shadow-xl p-6 flex flex-col items-center">
            <img
              src={logoMamaStock}
              alt="MamaStock"
              className="w-24 h-24 mb-4 rounded-xl shadow"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">
              Simplifiez votre gestion F&amp;B
            </h1>
            <p className="text-center mb-6 text-base sm:text-lg text-white/80">
              MamaStock centralise vos fournisseurs, vos produits et vos factures
              pour un suivi des coûts en toute simplicité.
            </p>
            {!session && (
              <Link to="/login">
                <Motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 rounded-xl bg-white/20 text-white font-semibold backdrop-blur-md border border-white/30 shadow transition"
                >
                  Se connecter
                </Motion.button>
              </Link>
            )}
          </div>
        </Motion.div>
      </div>
      <Footer />
    </div>
  );
}
