import { useAuth } from '@/hooks/useAuth';

export default function ResetAuthButton({ className = "" }) {
  const { resetAuth } = useAuth() || {};
  if (!resetAuth) return null;
  return (
    <button
      type="button"
      onClick={resetAuth}
      className={className}
    >
      Réinitialiser la connexion
    </button>
  );
}
