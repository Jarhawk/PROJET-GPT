import { renderHook, act } from '@testing-library/react';
import { LocaleProvider } from '@/context/LocaleContext';
import { useLocale } from '@/context/useLocale';
import { describe, test, expect } from 'vitest';

const wrapper = ({ children }) => <LocaleProvider>{children}</LocaleProvider>;

describe('useLocale', () => {
  test('changes language and translates', () => {
    const { result } = renderHook(() => useLocale(), { wrapper });
    expect(result.current.t('logout')).toBe('Déconnexion');
    act(() => result.current.setLocale('en'));
    expect(result.current.t('logout')).toBe('Logout');
  });
});
