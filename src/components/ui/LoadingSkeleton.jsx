export default function LoadingSkeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-white/20 rounded-md ${className}`} />
  );
}
