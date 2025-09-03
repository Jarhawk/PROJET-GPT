import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeProvider.jsx';
import { HelpProvider } from './context/HelpProvider.jsx';
import AuthProvider from './contexts/AuthContext.jsx';
import AppRoutes from './router.jsx';

const queryClient = new QueryClient();

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <HelpProvider>
            {/* AuthProvider DOIT être sous BrowserRouter sinon useNavigate casse */}
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </HelpProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
