import { createClient } from "@/lib/supabase/server";

/** True when the signed-in user is the tutor account (TUTOR_EMAIL). */
export async function isTutorRequest(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user && process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL);
}
