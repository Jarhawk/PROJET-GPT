import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRouter from "./router";
import AuthProvider from "./contexts/AuthContext"; // NE DOIT PAS appeler useNavigate hors Router

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      {/* AuthProvider doit éviter useNavigate dans son initialisation.
          S’il en a besoin après, le faire dans un effet déclenché *après* le mount.
      */}
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  );
}
