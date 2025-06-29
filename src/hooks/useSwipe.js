// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect } from 'react';

export function useSwipe(ref, { onSwipeLeft, onSwipeRight, threshold = 50 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX = null;

    function handleTouchStart(e) {
      startX = e.touches[0].clientX;
    }

    function handleTouchEnd(e) {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > threshold) {
        if (dx > 0) onSwipeRight && onSwipeRight();
        else onSwipeLeft && onSwipeLeft();
      }
      startX = null;
    }

    el.addEventListener('touchstart', handleTouchStart);
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, onSwipeLeft, onSwipeRight, threshold]);
}
