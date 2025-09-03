import { BrowserRouter } from 'react-router-dom';
import Layout from './layout/Layout';
import AppRoutes from './router.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import './i18n'; // s'assurer que i18n est initialisé tôt

export default function App() {
  return (
    <BrowserRouter>
      {/* BrowserRouter DOIT entourer les providers qui utilisent useNavigate */}
      <AuthProvider>
        <ErrorBoundary>
          <Layout>
            <AppRoutes />
          </Layout>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

