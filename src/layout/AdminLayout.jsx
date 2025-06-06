import Sidebar from "@/layout/Sidebar";
import Navbar from "@/layout/Navbar";

/**
 * Layout général pour les pages accessibles aux admins/managers.
 * Inclut la Sidebar à gauche, et la Navbar en haut.
 */
export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-mamastock-bg text-white">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar />
<main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
