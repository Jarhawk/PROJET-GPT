import React from 'react';

export default function BubblesParticles({
  count = 12,
  className = '',
  color = 'rgba(255,255,255,0.15)',
}) {
  const bubbles = Array.from({ length: count }).map((_, i) => {
    const delay = (Math.random() * 8).toFixed(2);
    const size = Math.floor(Math.random() * 24) + 12;
    const left = Math.random() * 100;
    const duration = (10 + Math.random() * 10).toFixed(2);
    const style = {
      left: `${left}%`,
      width: size,
      height: size,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      background: color,
    };
    return <span key={i} className="bubble" style={style} />;
  });
  return <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>{bubbles}</div>;
}
