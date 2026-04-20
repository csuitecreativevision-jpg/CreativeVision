/**
 * Demo/local UI only: last password entered at portal login, so Settings can prefill
 * "current password" and reveal it. Not a secure credential store — replace with real auth in production.
 */
export const PORTAL_CACHED_PASSWORD_KEY = 'portal_cached_login_password';
