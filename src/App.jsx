import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import RouterConfig from "./router";
import { useEffect } from "react";

// ErrorBoundary simple
function ErrorBoundary({ children }) {
  return (
    <React.Suspense fallback={<div>Chargement...</div>}>
      <React.Fragment>{children}</React.Fragment>
    </React.Suspense>
  );
}

// Loader contextuel (si Auth pas prêt)
function GlobalLoader() {
  const { loading } = useAuth();
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-mamastockGold"></div>
    </div>
  );
}

// Dark mode auto
function useDarkMode() {
  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    }
  }, []);
}

export default function App() {
  useDarkMode();
  return (
    <AuthProvider>
      <Router>
        <GlobalLoader />
        <ErrorBoundary>
          <RouterConfig />
        </ErrorBoundary>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}
