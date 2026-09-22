import type { SupabaseClient } from "@supabase/supabase-js";

export type ClientRow = {
  id: string;
  email: string;
  auth_user_id: string | null;
  full_name: string | null;
  phone: string | null;
  approved: boolean;
  approved_at: string | null;
};

/**
 * A client's row can exist before they ever sign in -- the tutor approves
 * them by email right after the consultation. This links the auth account
 * to that row on first login, or creates a fresh (unapproved) row if
 * they're logging in without ever having been approved yet.
 */
export async function getOrCreateClientForUser(
  admin: SupabaseClient,
  user: { id: string; email?: string | null }
): Promise<ClientRow> {
  const { data: byAuthId } = await admin
    .from("clients")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (byAuthId) return byAuthId as ClientRow;

  if (user.email) {
    const { data: byEmail } = await admin
      .from("clients")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (byEmail) {
      const { data: updated } = await admin
        .from("clients")
        .update({ auth_user_id: user.id })
        .eq("id", byEmail.id)
        .select()
        .single();
      return (updated ?? byEmail) as ClientRow;
    }
  }

  const { data: created } = await admin
    .from("clients")
    .insert({ email: user.email ?? `${user.id}@unknown.local`, auth_user_id: user.id })
    .select()
    .single();

  return created as ClientRow;
}
