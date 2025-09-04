// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';


// Simple wrapper used by the AuthContext and auth pages
export async function login(email, password) {
  const supabase = supabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

export async function signUp(email, password) {
  const supabase = supabase();
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function sendMagicLink(email) {
  const supabase = supabase();
  const { data, error } = await supabase.auth.signInWithOtp({ email });
  return { data, error };
}

export async function sendPhoneOtp(phone) {
  const supabase = supabase();
  const { data, error } = await supabase.auth.signInWithOtp({ phone });
  return { data, error };
}

export async function loginWithProvider(provider, options = {}) {
  const supabase = supabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options
  });
  return { data, error };
}

export async function verifyOtp(params) {
  const supabase = supabase();
  const { data, error } = await supabase.auth.verifyOtp(params);
  return { data, error };
}

export async function resetPassword(email) {
  const supabase = supabase();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
}

export async function resendEmailVerification(email) {
  const supabase = supabase();
  const { data, error } = await supabase.auth.resend({ type: 'signup', email });
  return { data, error };
}

export async function logout() {
  const supabase = supabase();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function updateEmail(newEmail) {
  const supabase = supabase();
  const { data, error } = await supabase.auth.updateUser({ email: newEmail });
  return { data, error };
}

export async function updatePassword(newPassword) {
  const supabase = supabase();
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
}

export async function updateProfile(metadata = {}) {
  const supabase = supabase();
  const { data, error } = await supabase.auth.updateUser({ data: metadata });
  return { data, error };
}

export async function getCurrentUser() {
  const supabase = supabase();
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

export async function getSession() {
  const supabase = supabase();
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

export async function refreshSession(currentSession) {
  const supabase = supabase();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: currentSession.refresh_token
  });
  return { data, error };
}

export const onAuthStateChange = (cb) => {
  const supabase = supabase();
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  supabase.auth.getSession().then(({ data }) => cb(data?.session ?? null));
  return () => subscription?.unsubscribe();
};

export async function getAccessToken() {
  const supabase = supabase();
  const { data, error } = await supabase.auth.getSession();
  return { token: data?.session?.access_token, error };
}

export async function enableTwoFa(code) {
  const supabase = supabase();
  const { data, error } = await supabase.rpc('enable_two_fa', { code });
  return { data, error };
}

export async function disableTwoFa() {
  const supabase = supabase();
  const { data, error } = await supabase.rpc('disable_two_fa');
  return { data, error };
}