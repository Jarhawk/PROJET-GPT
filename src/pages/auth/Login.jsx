// src/pages/Login.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo-mamastock.png";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { isAuthenticated, loading: authLoading } = useAuth();

  // Si déjà connecté, redirige vers dashboard
  if (isAuthenticated && !authLoading) {
    navigate("/");
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Identifiants incorrects ou compte inactif.");
      setLoading(false);
    } else {
      // Attends que AuthContext se mette à jour puis redirige
      setTimeout(() => {
        setLoading(false);
        navigate("/");
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-mamastock-bg flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg flex overflow-hidden">
        {/* Logo à gauche */}
        <div className="w-1/2 bg-mamastock-bg flex flex-col justify-center items-center p-8">
          <img src={logo} alt="MamaStock Logo" className="w-32 mb-6" />
          <h2 className="text-3xl font-bold text-mamastock-gold text-center">
            Connexion MamaStock
          </h2>
        </div>
        {/* Formulaire à droite */}
        <form
          onSubmit={handleLogin}
          className="w-1/2 flex flex-col justify-center p-8 gap-4"
        >
          <label className="text-mamastock-text font-medium">
            Email
            <input
              className="input input-bordered w-full mt-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="text-mamastock-text font-medium">
            Mot de passe
            <input
              className="input input-bordered w-full mt-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <div className="text-red-600">{error}</div>}
          <button
            className="btn bg-mamastock-gold text-white mt-4"
            type="submit"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
