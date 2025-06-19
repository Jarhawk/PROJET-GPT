import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const { access_rights, role, loading } = useAuth();

  if (loading) return null;
  const showAll = role === "superadmin";

  return (
    <aside className="w-64 bg-mamastockBg text-white p-4 h-screen shadow-md">
      <h2 className="text-2xl font-bold mb-6">MamaStock</h2>
      <nav className="flex flex-col gap-2">
        {(showAll || access_rights.includes("dashboard")) && (
          <Link to="/dashboard">Dashboard</Link>
        )}
        {(showAll || access_rights.includes("stock")) && (
          <Link to="/produits">Produits / Stock</Link>
        )}
        {(showAll || access_rights.includes("factures")) && (
          <Link to="/factures">Factures</Link>
        )}
        {(showAll || access_rights.includes("fiches")) && (
          <Link to="/fiches">Fiches techniques</Link>
        )}
        {(showAll || access_rights.includes("parametrage")) && (
          <Link to="/parametrage">Paramétrage</Link>
        )}
      </nav>
    </aside>
  );
}
