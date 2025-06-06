// src/App.jsx
import { useAuth } from "@/context/AuthContext";
import Router from "@/router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Composant pour gérer le chargement initial (avant que authReady soit vrai)
function AppGuard() {
  const { authReady } = useAuth();

  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="text-center space-y-2">
          <div className="animate-spin h-10 w-10 border-4 border-mamastockGold border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-mamastockText">Chargement des accès...</p>
        </div>
      </div>
    );
  }

  return <Router />;
}

export default function App() {
  return (
    <>
      <AppGuard />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </>
  );
}
