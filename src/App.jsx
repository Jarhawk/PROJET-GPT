import Router from "@/router";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Router />
      </BrowserRouter>
    </AuthProvider>
  );
}
