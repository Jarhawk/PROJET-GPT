import { LoadingSpinner } from "./LoadingSpinner";

export default function LoadingScreen({ message = "Chargement..." }) {
  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <LoadingSpinner message={message} />
    </div>
  );
}
