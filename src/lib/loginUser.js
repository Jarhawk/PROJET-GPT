import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = 'https://jhpfdeolleprmvtchoxt.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpocGZkZW9sbGVwcm12dGNob3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MjI4MzMsImV4cCI6MjA2MjI5ODgzM30.f_J81QTBK4cvFoFUvlY6XNmuS5DSMLUdT_ZQQ7FpOFQ';

// Initialize the Supabase client with provided credentials
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Authenticates a user with email and password.
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Promise<{user: object, access_token: string, refresh_token: string}|{errorCode: string|number, errorMessage: string}>}
 */
export async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login error:', error);
      const message = error.message || error.error_description || 'Unknown error';
      let code = error.status || error.code || 'auth_error';
      // Attempt to categorise common errors
      if (/user.*not.*found/i.test(message)) code = 'user_not_found';
      else if (/invalid.*login|wrong.*password|mot de passe/i.test(message)) code = 'invalid_password';
      return { errorCode: code, errorMessage: message };
    }
    if (!data?.session || !data.user) {
      console.error('Login succeeded but session or user is missing', data);
      return { errorCode: 'invalid_response', errorMessage: 'Réponse Supabase invalide' };
    }
    const { session, user } = data;
    return {
      user,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    };
  } catch (err) {
    console.error('Unexpected error during login:', err);
    return { errorCode: 'unexpected_error', errorMessage: err.message || 'Erreur inconnue' };
  }
}
