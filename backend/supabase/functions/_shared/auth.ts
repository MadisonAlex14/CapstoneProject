import { supabase, authClient } from "./createClient.ts";


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
 * Get the profile ID from an authentication token
 * @param token - The JWT authentication token
 * @returns The profile ID or null if not found
 * @throws Error if the token is invalid or the user is not found
 */
export async function getProfileIdFromToken(token: string): Promise<string> {
  // Validate token with Supabase to ensure it is active and valid
  const { data: userData, error: userError } = await authClient.auth.getUser(token)

  if (userError || !userData?.user) {
    throw new Error('Invalid or expired authentication token')
  }

  const userId = userData.user.id

  // Fetch the profile_id from the profile table
  const { data, error } = await supabase
    .from('profile')
    .select('profile_id')
    .eq('auth_id', userId)
    .single()

  if (error || !data?.profile_id) {
    throw new Error(`Failed to fetch profile: ${error?.message ?? 'Profile not found'}`)
  }

  return data.profile_id
}

