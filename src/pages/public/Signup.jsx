import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import MamaLogo from "@/components/ui/MamaLogo";

export default function Signup() {
  const [restaurant, setRestaurant] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      return;
    }
    const { data: mama } = await supabase
      .from("mamas")
      .insert({ nom: restaurant })
      .select()
      .single();
    await supabase
      .from("users")
      .update({ role: "admin", mama_id: mama.id })
      .eq("id", authData.user.id);
    setLoading(false);
    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f1c2e] via-[#232a34] to-[#bfa14d] p-8">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md bg-white/30 backdrop-blur-xl rounded-xl p-8 space-y-4"
      >
        <div className="text-center">
          <MamaLogo width={80} className="mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white">Créer un compte</h1>
        </div>
        <div>
          <label className="block text-sm text-white mb-1">Nom du restaurant</label>
          <input
            className="w-full rounded border border-white/30 bg-white/20 py-2 px-3 text-white placeholder-white/70"
            value={restaurant}
            onChange={(e) => setRestaurant(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-white mb-1">Email</label>
          <input
            className="w-full rounded border border-white/30 bg-white/20 py-2 px-3 text-white placeholder-white/70"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm text-white mb-1">Mot de passe</label>
          <input
            className="w-full rounded border border-white/30 bg-white/20 py-2 px-3 text-white placeholder-white/70"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          className="w-full py-2 rounded bg-mamastockGold text-mamastockBg font-semibold hover:bg-mamastockGoldHover transition"
          disabled={loading}
        >
          {loading ? "Création..." : "S'inscrire"}
        </button>
      </form>
    </div>
  );
}
