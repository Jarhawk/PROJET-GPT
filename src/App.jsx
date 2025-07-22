// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import Router from "@/router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import nprogress from 'nprogress';
import { useEffect } from 'react';
import { HelpProvider } from "@/context/HelpProvider";
import { MultiMamaProvider } from "@/context/MultiMamaContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import { Toaster } from "react-hot-toast";
import CookieConsent from "@/components/CookieConsent";

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    nprogress.configure({ showSpinner: false });
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <HelpProvider>
        <MultiMamaProvider>
          <ThemeProvider>
            <Toaster position="top-right" />
            <Router />
            <CookieConsent />
          </ThemeProvider>
        </MultiMamaProvider>
      </HelpProvider>
    </QueryClientProvider>
  );
}

