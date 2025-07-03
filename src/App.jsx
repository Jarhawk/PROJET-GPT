// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import Router from "@/router";
import { HelpProvider } from "@/context/HelpProvider";
import { MultiMamaProvider } from "@/context/MultiMamaContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import { Toaster } from "react-hot-toast";
import CookieConsent from "@/components/CookieConsent";

export default function App() {
  return (
    <HelpProvider>
      <MultiMamaProvider>
        <ThemeProvider>
          <Toaster position="top-right" />
          <Router />
          <CookieConsent />
        </ThemeProvider>
      </MultiMamaProvider>
    </HelpProvider>
  );
}

