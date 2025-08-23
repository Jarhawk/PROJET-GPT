import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/supabase.js', () => {
  const supabase = {
    auth: {
      signInWithPassword: vi.fn(() => ({ data: { user: 'u' }, error: null })),
      signUp: vi.fn(() => ({ data: { user: 'n' }, error: null })),
      signInWithOtp: vi.fn(() => ({ data: { user: 'magic' }, error: null })),
      signInWithOAuth: vi.fn(() => ({ data: { provider: 'p' }, error: null })),
      verifyOtp: vi.fn(() => ({ data: { user: 'verified' }, error: null })),
      resetPasswordForEmail: vi.fn(() => ({ data: {}, error: null })),
      resend: vi.fn(() => ({ data: {}, error: null })),
      signOut: vi.fn(() => ({ error: null })),
      updateUser: vi.fn((d) => ({ data: d, error: null })),
      getUser: vi.fn(() => ({ data: { user: 'cur' }, error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: { access_token: 's' } }, error: null })),
      refreshSession: vi.fn(() => ({ data: { session: 'new' }, error: null })),
      onAuthStateChange: vi.fn((cb) => {
        cb('SIGNED_IN', { session: 's' });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
    rpc: vi.fn(() => ({ data: { ok: true }, error: null })),
  };
  return { __esModule: true, getSupabaseClient: () => supabase, supabase };
});

import {
  login,
  logout,
  signUp,
  sendMagicLink,
  loginWithProvider,
  sendPhoneOtp,
  verifyOtp,
  resetPassword,
  updateEmail,
  updatePassword,
  updateProfile,
  getCurrentUser,
  getSession,
  refreshSession,
  onAuthStateChange,
  getAccessToken,
  enableTwoFa,
  disableTwoFa,
} from '../src/lib/loginUser.js';
import { supabase as mockedSupabase } from '../src/lib/supabase.js';

describe('loginUser helpers', () => {
  it('login calls signInWithPassword', async () => {
    const res = await login('a@b.c', 'x');
    expect(mockedSupabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.c', password: 'x' });
    expect(res.data).toEqual({ user: 'u' });
  });

  it('logout calls signOut', async () => {
    const res = await logout();
    expect(mockedSupabase.auth.signOut).toHaveBeenCalled();
    expect(res.error).toBeNull();
  });

  it('signUp calls signUp', async () => {
    const res = await signUp('new@b.c', 'p');
    expect(mockedSupabase.auth.signUp).toHaveBeenCalledWith({ email: 'new@b.c', password: 'p' });
    expect(res.data).toEqual({ user: 'n' });
  });

  it('sendMagicLink calls signInWithOtp', async () => {
    const res = await sendMagicLink('x@y.z');
    expect(mockedSupabase.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'x@y.z' });
    expect(res.data).toEqual({ user: 'magic' });
  });

  it('loginWithProvider calls signInWithOAuth', async () => {
    const res = await loginWithProvider('github', { redirectTo: 'url' });
    expect(mockedSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'github',
      options: { redirectTo: 'url' },
    });
    expect(res.data).toEqual({ provider: 'p' });
  });

  it('sendPhoneOtp calls signInWithOtp with phone', async () => {
    const res = await sendPhoneOtp('123');
    expect(mockedSupabase.auth.signInWithOtp).toHaveBeenCalledWith({ phone: '123' });
    expect(res.data).toEqual({ user: 'magic' });
  });

  it('verifyOtp calls verifyOtp', async () => {
    const res = await verifyOtp({ email: 'a@b.c', token: '123', type: 'magiclink' });
    expect(mockedSupabase.auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.c', token: '123', type: 'magiclink' });
    expect(res.data).toEqual({ user: 'verified' });
  });

  it('resetPassword calls resetPasswordForEmail', async () => {
    const res = await resetPassword('reset@b.c');
    expect(mockedSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('reset@b.c');
    expect(res.error).toBeNull();
  });

  it('resendEmailVerification calls resend', async () => {
    const { resendEmailVerification } = await import('../src/lib/loginUser.js');
    const res = await resendEmailVerification('verify@b.c');
    expect(mockedSupabase.auth.resend).toHaveBeenCalledWith({ type: 'signup', email: 'verify@b.c' });
    expect(res.error).toBeNull();
  });

  it('updateEmail calls updateUser', async () => {
    const res = await updateEmail('new@b.c');
    expect(mockedSupabase.auth.updateUser).toHaveBeenCalledWith({ email: 'new@b.c' });
    expect(res.data).toEqual({ email: 'new@b.c' });
  });

  it('updatePassword calls updateUser', async () => {
    const res = await updatePassword('secret');
    expect(mockedSupabase.auth.updateUser).toHaveBeenCalledWith({ password: 'secret' });
    expect(res.data).toEqual({ password: 'secret' });
  });

  it('updateProfile calls updateUser with metadata', async () => {
    const res = await updateProfile({ role: 'admin' });
    expect(mockedSupabase.auth.updateUser).toHaveBeenCalledWith({ data: { role: 'admin' } });
    expect(res.data).toEqual({ data: { role: 'admin' } });
  });

  it('getCurrentUser calls getUser', async () => {
    const res = await getCurrentUser();
    expect(mockedSupabase.auth.getUser).toHaveBeenCalled();
    expect(res.data).toEqual({ user: 'cur' });
  });

  it('getSession calls getSession', async () => {
    const res = await getSession();
    expect(mockedSupabase.auth.getSession).toHaveBeenCalled();
    expect(res.data).toEqual({ session: { access_token: 's' } });
  });

  it('refreshSession calls refreshSession', async () => {
    const res = await refreshSession({ refresh_token: 'tok' });
    expect(mockedSupabase.auth.refreshSession).toHaveBeenCalledWith({
      refresh_token: 'tok',
    });
    expect(res.data).toEqual({ session: 'new' });
  });

  it('onAuthStateChange passes session object', async () => {
    mockedSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { session: 's' } },
      error: null,
    });
    const cb = vi.fn();
    const unsub = onAuthStateChange(cb);
    await new Promise((r) => setTimeout(r, 0));
    expect(cb).toHaveBeenNthCalledWith(1, { session: 's' });
    expect(cb).toHaveBeenNthCalledWith(2, { session: 's' });
    expect(cb).toHaveBeenCalledTimes(2);
    expect(mockedSupabase.auth.onAuthStateChange).toHaveBeenCalled();
    unsub();
  });

  it('getAccessToken returns token', async () => {
    const res = await getAccessToken();
    expect(mockedSupabase.auth.getSession).toHaveBeenCalled();
    expect(res.token).toBe('s');
  });

  it('enableTwoFa calls rpc', async () => {
    const res = await enableTwoFa('111111');
    expect(mockedSupabase.rpc).toHaveBeenCalledWith('enable_two_fa', { code: '111111' });
    expect(res.data).toEqual({ ok: true });
  });

  it('disableTwoFa calls rpc', async () => {
    const res = await disableTwoFa();
    expect(mockedSupabase.rpc).toHaveBeenCalledWith('disable_two_fa');
    expect(res.data).toEqual({ ok: true });
  });
});
