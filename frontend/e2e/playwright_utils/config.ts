/**
 * Test configuration and environment helpers
 * Loads environment variables from .env.local
 */

export const getEnvVar = (key: string, defaultValue?: string): string => {
  // Environment variables are available in process.env after dotenv loads them
  const value = process.env[key];
  if (!value && !defaultValue) {
    console.warn(`Environment variable ${key} is not set`);
    return defaultValue || '';
  }
  return value || defaultValue || '';
};

/**
 * Supabase configuration from environment variables
 */
export const supabaseConfig = {
  url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:3000'),
  anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),
};

/**
 * Test user credentials (if needed for authentication tests)
 * These can be added to .env.local as TEST_USER_EMAIL and TEST_USER_PASSWORD
 */
export const testUserCredentials = {
  email: getEnvVar('TEST_USER_EMAIL', 'abbygerstner16@gmail.com'),
  password: getEnvVar('TEST_USER_PASSWORD', 'creditmaxxing123!'),
};

/**
 * Validate that required environment variables are set
 */
export const validateEnvironment = (): void => {
  const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.warn(
      `Warning: Missing environment variables: ${missing.join(', ')}\n` +
      'Make sure .env.local is present and configured correctly.'
    );
  }
};
