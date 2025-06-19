import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Produits from "@/pages/produits/Produits";
import Factures from "@/pages/factures/Factures";
import Fiches from "@/pages/fiches/Fiches";
import Parametrage from "@/pages/parametrage/Parametrage";
import Login from "@/pages/auth/Login";
import AuthDebug from "@/pages/debug/AuthDebug";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/produits" element={<Produits />} />
          <Route path="/factures" element={<Factures />} />
          <Route path="/fiches" element={<Fiches />} />
          <Route path="/parametrage" element={<Parametrage />} />
          <Route path="/debug/auth" element={<AuthDebug />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
