import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex h-screen bg-mamastock-bg text-mamastock-text">
      <a href="#main" className="sr-only focus:not-sr-only">
        Aller au contenu principal
      </a>
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar />
        <main id="main" className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
