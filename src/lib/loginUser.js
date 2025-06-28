import { supabase } from './supabase';

// Use the shared Supabase client from src/lib/supabase.js

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
