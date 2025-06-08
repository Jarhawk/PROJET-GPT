export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-600">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="text-xl mb-4">Page non trouvée.</p>
      <a href="/" className="text-mamastock-gold underline">
        Retour à l’accueil
      </a>
    </div>
  );
}
