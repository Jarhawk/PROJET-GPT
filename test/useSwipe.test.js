// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { renderHook } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import { useSwipe } from '@/hooks/useSwipe';

function createTouchEvent(name, x) {
  const e = new Event(name, { bubbles: true });
  e.changedTouches = [{ clientX: x }];
  e.touches = [{ clientX: x }];
  return e;
}

test('calls callbacks on swipe', () => {
  const ref = { current: document.createElement('div') };
  const onLeft = vi.fn();
  const onRight = vi.fn();
  renderHook(() => useSwipe(ref, { onSwipeLeft: onLeft, onSwipeRight: onRight, threshold: 30 }));

  ref.current.dispatchEvent(createTouchEvent('touchstart', 10));
  ref.current.dispatchEvent(createTouchEvent('touchend', 60));
  expect(onRight).toHaveBeenCalled();

  ref.current.dispatchEvent(createTouchEvent('touchstart', 60));
  ref.current.dispatchEvent(createTouchEvent('touchend', 10));
  expect(onLeft).toHaveBeenCalled();
});
