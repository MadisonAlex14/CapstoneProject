import { AuthError, createClient } from "npm:@supabase/supabase-js@2";

// Initialize Supabase client at module level for persistence through warm starts
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

// 1. Client for Auth Verification (Uses Anon Key)
// This client MUST be used to verify user JWTs.
export const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

// Create service role client (bypasses RLS, use with caution)
// Exported for use in all functions for direct db access
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
