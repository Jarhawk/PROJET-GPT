export default function PageWrapper({ children, className = '' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-[clamp(1rem,4vw,2rem)]">
      <div className={`w-full max-w-md ${className}`}>{children}</div>
    </div>
  );
}
