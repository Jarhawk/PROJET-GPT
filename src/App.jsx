import Router from "@/router";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router />
    </AuthProvider>
  );
}
