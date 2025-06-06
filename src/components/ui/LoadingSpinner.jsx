// src/components/ui/LoadingSpinner.jsx

export function LoadingSpinner({ message = "Chargement en cours..." }) {
  return (
    <div
      className="flex flex-col justify-center items-center h-full w-full p-8 text-white"
      role="status"
      aria-live="polite"
    >
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-mamastock-gold mb-2" />
      <p className="text-sm text-mamastock-text">{message}</p>
    </div>
  );
}
