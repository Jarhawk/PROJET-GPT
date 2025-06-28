import { useEffect, useState } from 'react';

export default function TouchLight({ className = '' }) {
  const [ripple, setRipple] = useState(null);

  useEffect(() => {
    const handleTouch = (e) => {
      const t = e.touches[0];
      if (!t) return;
      const x = t.clientX;
      const y = t.clientY;
      setRipple({ x, y, id: Date.now() });
    };
    window.addEventListener('touchstart', handleTouch);
    return () => window.removeEventListener('touchstart', handleTouch);
  }, []);

  return (
    <div className={`md:hidden fixed inset-0 pointer-events-none ${className}`}>
      {ripple && (
        <span
          key={ripple.id}
          className="absolute block w-40 h-40 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2 animate-touch-fade"
          style={{ left: ripple.x, top: ripple.y }}
          onAnimationEnd={() => setRipple(null)}
        />
      )}
    </div>
  );
}
