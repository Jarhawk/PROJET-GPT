import Router from "@/router";
import { AuthProvider } from "@/context/AuthContext";
import { HelpProvider } from "@/context/HelpProvider";
import { MultiMamaProvider } from "@/context/MultiMamaContext";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";

export default function App() {
  return (
    <AuthProvider>
      <HelpProvider>
        <MultiMamaProvider>
          <BrowserRouter>
            <Toaster position="top-right" />
            <Router />
          </BrowserRouter>
        </MultiMamaProvider>
      </HelpProvider>
    </AuthProvider>
  );
}

