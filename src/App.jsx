// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import router from "@/router";
import { RouterProvider } from 'react-router-dom';
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
  useEffect(() => {
    const normalize = (e) => {
      if (e.target instanceof HTMLInputElement && e.target.type === 'number') {
        if (e.target.value.includes(',')) {
          e.target.value = e.target.value.replace(',', '.');
        }
      }
    };
    const applyAttrs = (el) => {
      if (el instanceof HTMLInputElement && el.type === 'number') {
        el.setAttribute('inputmode', 'decimal');
        el.setAttribute('pattern', '[0-9]*[.,]?[0-9]*');
      }
    };
    document.querySelectorAll('input[type="number"]').forEach(applyAttrs);
    const observer = new MutationObserver((muts) => {
      muts.forEach((m) =>
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches('input[type="number"]')) applyAttrs(node);
            node.querySelectorAll?.('input[type="number"]').forEach(applyAttrs);
          }
        })
      );
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('change', normalize, true);
    return () => {
      document.removeEventListener('change', normalize, true);
      observer.disconnect();
    };
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <HelpProvider>
        <MultiMamaProvider>
          <ThemeProvider>
            <ToastRoot />
            <RouterProvider router={router} />
            <CookieConsent />
          </ThemeProvider>
        </MultiMamaProvider>
      </HelpProvider>
    </QueryClientProvider>
  );
}

