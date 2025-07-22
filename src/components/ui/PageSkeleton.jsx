export default function PageSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-6 w-1/3 bg-white/20 rounded" />
      <div className="h-4 w-1/2 bg-white/20 rounded" />
      <div className="h-64 w-full bg-white/20 rounded" />
    </div>
  );
}
