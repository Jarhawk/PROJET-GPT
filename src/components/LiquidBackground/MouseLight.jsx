import { useEffect, useState } from 'react';

export default function MouseLight({ className = '' }) {
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  useEffect(() => {
    const handleMove = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);
  return (
    <div
      className={`hidden md:block fixed inset-0 pointer-events-none mix-blend-overlay ${className}`}
      style={{
        background: `radial-gradient(circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.25), transparent 80%)`,
        transition: 'background 0.15s',
      }}
    />
  );
}
