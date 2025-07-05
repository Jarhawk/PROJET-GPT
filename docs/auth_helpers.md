# Authentication Helpers

`src/lib/loginUser.js` exposes simple helper functions for Supabase Auth.

## login

```js
const { data, error } = await login(email, password);
```

Calls `supabase.auth.signInWithPassword` and returns the resulting
`data` and `error` objects.

## signUp

```js
const { data, error } = await signUp(email, password);
```

Registers a new user via `supabase.auth.signUp` and resolves with the result.

## sendMagicLink

```js
const { data, error } = await sendMagicLink(email);
```

Sends a passwordless login link using `supabase.auth.signInWithOtp`.

## loginWithProvider

```js
const { data, error } = await loginWithProvider('github', { redirectTo: 'https://app' });
```

Starts an OAuth sign-in flow via `supabase.auth.signInWithOAuth` with the given provider.

## sendPhoneOtp

```js
const { data, error } = await sendPhoneOtp(phone);
```

Sends an OTP code to the given phone number using `signInWithOtp`.

## verifyOtp

```js
const { data, error } = await verifyOtp({ email, token, type: 'magiclink' });
```

Verifies a one-time password via `supabase.auth.verifyOtp`.

## resetPassword

```js
const { data, error } = await resetPassword(email);
```

Sends a password recovery email using `supabase.auth.resetPasswordForEmail`.

## resendEmailVerification

```js
const { data, error } = await resendEmailVerification(email);
```

Resends the signup confirmation email using `supabase.auth.resend` with `type: 'signup'`.

## logout

```js
const { error } = await logout();
```

Ends the current session via `supabase.auth.signOut` and resolves with
any returned error.

## updateEmail

```js
const { data, error } = await updateEmail(newEmail);
```

Updates the logged-in user's email via `supabase.auth.updateUser`.

## updatePassword

```js
const { data, error } = await updatePassword(newPassword);
```

Changes the logged-in user's password using `supabase.auth.updateUser`.

## updateProfile

```js
const { data, error } = await updateProfile({ full_name: 'New Name' });
```

Updates arbitrary user metadata via `supabase.auth.updateUser`.

## getCurrentUser

```js
const { data, error } = await getCurrentUser();
```

Retrieves the currently authenticated user via `supabase.auth.getUser`.

## getSession

```js
const { data, error } = await getSession();
```

Returns the active session using `supabase.auth.getSession`.

## refreshSession

```js
const { data, error } = await refreshSession(session);
```

Renews the access token with `supabase.auth.refreshSession` by passing the
current session object.

## onAuthStateChange

```js
const unsubscribe = onAuthStateChange((session) => {
  console.log('new session', session);
});
```

Registers a callback for authentication state changes via
`supabase.auth.onAuthStateChange`. The returned function unsubscribes the
listener.

## getAccessToken

```js
const { token, error } = await getAccessToken();
```

Resolves with the current access token extracted from `supabase.auth.getSession`.

## enableTwoFa

```js
const { data, error } = await enableTwoFa('123456');
```

Calls the `enable_two_fa` RPC with the provided TOTP code to activate two-factor authentication for the current user.

## disableTwoFa

```js
const { data, error } = await disableTwoFa();
```

Disables two-factor authentication by invoking the `disable_two_fa` RPC.
