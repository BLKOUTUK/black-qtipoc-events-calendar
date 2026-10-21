/**
 * Authorization header for ivor-core's signed-in routes (RSVP organiser views,
 * check-in, "my RSVPs"). Same session read as ModerationDashboardPage: the
 * no-op fallback client doesn't implement getSession, so cast and fail soft.
 */
import { supabase } from './supabase';

export async function sessionAuthHeaders(): Promise<Record<string, string>> {
  try {
    const auth = supabase.auth as unknown as {
      getSession: () => Promise<{ data: { session: { access_token: string } | null } }>;
    };
    const { data } = await auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
