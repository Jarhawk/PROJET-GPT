import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRouter from "./router";
import AuthProvider from "./contexts/AuthContext"; // NE DOIT PAS appeler useNavigate hors Router

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  );
}
