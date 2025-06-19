import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";

export default function Layout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
