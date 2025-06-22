import Router from "@/router";
import { AuthProvider } from "@/context/AuthContext";
import { HelpProvider } from "@/context/HelpProvider";
import { MultiMamaProvider } from "@/context/MultiMamaContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";

export default function App() {
  return (
    <AuthProvider>
      <HelpProvider>
        <MultiMamaProvider>
          <ThemeProvider>
            <BrowserRouter>
              <Toaster position="top-right" />
              <Router />
            </BrowserRouter>
          </ThemeProvider>
        </MultiMamaProvider>
      </HelpProvider>
    </AuthProvider>
  );
}

