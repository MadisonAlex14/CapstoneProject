import { AuthError } from "npm:@supabase/supabase-js@2";
import { supabase } from "./createClient.ts";

/**
 * Decode JWT token to extract the user ID (sub claim)
 * @param token - The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const decoded = atob(parts[1])
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Extract an authentication token from the request headers.
 * Throws an error if the token is missing.
 * @param req - The incoming HTTP request
 * @returns The extracted authentication token
 * @throws Error if the authorization token is missing
 */
export function extractAuthToken(req: Request) {
    const authHeader = req.headers.get("authorization");
    const userToken = authHeader?.replace("Bearer ", "");

    if (!userToken) {
      throw new Error("Authorization token required");
    }

    return userToken;
}


/**
 * Get the authenticated user from the request.
 * @returns An object containing the user data and any authentication error
 * @param req The incoming HTTP request
 */
export async function getUserFromRequest(req: Request) {
    const userToken = extractAuthToken(req);
    const { data, error } = await supabase.auth.getUser(userToken);

    return { user_data: data, user_error: error };
}

/**
 * Get the profile ID from an authentication token
 * @param token - The JWT authentication token
 * @returns The profile ID or null if not found
 * @throws Error if the token is invalid or the user is not found
 */
export async function getProfileIdFromToken(token: string): Promise<string | null> {
  // Decode the JWT to get the user ID
  const payload = decodeJWT(token)
  if (!payload || !payload.sub) {
    throw new Error('Invalid token format')
  }

  const userId = payload.sub as string

  // Fetch the profile_id from the profile table
  const { data, error } = await supabase
    .from('profile')
    .select('profile_id')
    .eq('auth_id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }

  return data?.profile_id || null
}

