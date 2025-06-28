import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col min-h-[100vh] bg-[#f8f8fa] relative">
      <div className="flex-grow flex flex-col items-center justify-center px-4">
        <Motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <Card className="rounded-2xl shadow-xl p-6 flex flex-col items-center bg-white">
            <img
              src={logoMamaStock}
              alt="MamaStock"
              className="w-24 h-24 mb-4 rounded-xl shadow"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2e2e3a] text-center mb-2">
              Simplifiez votre gestion F&amp;B
            </h1>
            <p className="text-[#2e2e3a]/70 text-center mb-6 text-base sm:text-lg">
              MamaStock centralise vos fournisseurs, vos produits et vos factures
              pour un suivi des coûts en toute simplicité.
            </p>
            {!session && (
              <Button className="bg-[#ff5a5f] text-white rounded-xl px-8 py-3 text-lg font-semibold hover:bg-[#e04b50] transition" size="lg">
                <Link to="/login">Se connecter</Link>
              </Button>
            )}
          </Card>
        </Motion.div>
      </div>
      <Footer />
    </div>
  );
}
