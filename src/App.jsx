import Router from "@/router";
import { AuthProvider } from "@/context/AuthContext";
import { HelpProvider } from "@/context/HelpProvider";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";

export default function App() {
  return (
    <AuthProvider>
      <HelpProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Router />
        </BrowserRouter>
      </HelpProvider>
    </AuthProvider>
  );
}

