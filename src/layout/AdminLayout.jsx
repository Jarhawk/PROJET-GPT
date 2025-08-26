// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import Sidebar from "@/layout/Sidebar";
import Navbar from "@/layout/Navbar";
import {
  LiquidBackground,
  WavesBackground,
  MouseLight,
  TouchLight,
} from "@/components/LiquidBackground";

/**
 * Layout général pour les pages accessibles aux admins/managers.
 * Inclut la Sidebar à gauche, et la Navbar en haut.
 */
export default function AdminLayout({ children }) {
  return (
    <div className="relative flex min-h-screen text-white text-shadow overflow-hidden">
      <LiquidBackground showParticles />
      <WavesBackground className="opacity-40" />
      <MouseLight />
      <TouchLight />
      <Sidebar />
      <div className="flex flex-col flex-1 relative z-10">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
