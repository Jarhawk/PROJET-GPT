import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));

// Ajoute ici d’autres pages si besoin (Produits, Factures, etc.) via lazy imports
// const Produits = lazy(() => import('./pages/produits/Produits.jsx'));

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Exemple d’autres routes :
        <Route path="/produits" element={<Produits />} />
        */}
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
