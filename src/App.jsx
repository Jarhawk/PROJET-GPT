// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import Router from "@/router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import nprogress from 'nprogress';
import { useEffect } from 'react';
import { HelpProvider } from "@/context/HelpProvider";
import { MultiMamaProvider } from "@/context/MultiMamaContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import CookieConsent from "@/components/CookieConsent";
import ToastRoot from "@/components/ToastRoot";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
      keepPreviousData: true,
    },
  },
});

export default function App() {
  useEffect(() => {
    nprogress.configure({ showSpinner: false });
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <HelpProvider>
        <MultiMamaProvider>
          <ThemeProvider>
            <ToastRoot />
            <Router />
            <CookieConsent />
          </ThemeProvider>
        </MultiMamaProvider>
      </HelpProvider>
    </QueryClientProvider>
  );
}

