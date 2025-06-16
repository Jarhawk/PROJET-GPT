import { renderHook, act } from '@testing-library/react';
import { useFavorites } from "@/hooks/useFavorites";
import { beforeEach, expect, test } from 'vitest';

beforeEach(() => {
  localStorage.clear();
});

test('toggleFavorite stores ids in localStorage', () => {
  const { result } = renderHook(() => useFavorites('fav_test'));
  act(() => result.current.toggleFavorite('1'));
  expect(result.current.isFavorite('1')).toBe(true);
  const stored = JSON.parse(localStorage.getItem('fav_test'));
  expect(stored).toEqual(['1']);
  act(() => result.current.toggleFavorite('1'));
  expect(result.current.isFavorite('1')).toBe(false);
  expect(JSON.parse(localStorage.getItem('fav_test'))).toEqual([]);
});
