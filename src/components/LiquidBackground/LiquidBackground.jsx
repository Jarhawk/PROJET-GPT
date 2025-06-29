// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from 'react';
import BubblesParticles from './BubblesParticles';

export default function LiquidBackground({
  className = '',
  showParticles = false,
  particles = 12,
  intensity = 1,
}) {
  const style1 = { opacity: 0.4 * intensity };
  const style2 = { opacity: 0.2 * intensity };
  const style3 = { opacity: 0.15 * intensity };
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div
        className="absolute -top-10 -left-20 w-[480px] h-[420px] bg-gradient-to-br from-[#bfa14d] via-[#fff8e1]/70 to-transparent blur-[90px] rounded-full animate-liquid"
        style={style1}
      />
      <div
        className="absolute bottom-[-20%] right-[-18%] w-[480px] h-[420px] bg-gradient-to-br from-[#fff8e1]/90 via-white/60 to-transparent blur-[80px] rounded-full animate-liquid2"
        style={style2}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[280px] h-[180px] bg-white/20 blur-2xl rounded-[36%_54%_41%_59%/50%_41%_59%_50%] animate-liquid3"
        style={style3}
      />
      {showParticles && <BubblesParticles count={particles} />}
    </div>
  );
}
