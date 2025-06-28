import React from 'react';

export default function WavesBackground({ className = '' }) {
  return (
    <div className={`absolute inset-x-0 bottom-0 h-32 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <svg className="wave text-white/10 fill-current" viewBox="0 0 1440 320">
        <path d="M0 160L48 149.3C96 139 192 117 288 138.7C384 160 480 224 576 245.3C672 267 768 245 864 218.7C960 192 1056 160 1152 149.3C1248 139 1344 149 1392 154.7L1440 160V320H1392C1344 320 1248 320 1152 320C1056 320 960 320 864 320C768 320 672 320 576 320C480 320 384 320 288 320C192 320 96 320 48 320H0Z" />
      </svg>
      <svg className="wave text-white/5 fill-current" viewBox="0 0 1440 320">
        <path d="M0 160L48 138.7C96 117 192 75 288 74.7C384 75 480 117 576 144C672 171 768 181 864 170.7C960 160 1056 128 1152 112C1248 96 1344 96 1392 96L1440 96V320H1392C1344 320 1248 320 1152 320C1056 320 960 320 864 320C768 320 672 320 576 320C480 320 384 320 288 320C192 320 96 320 48 320H0Z" />
      </svg>
    </div>
  );
}
