import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Direct approve/revoke by client id -- needed for clients who logged in
// without ever booking a consultation, since the outcome route only
// covers people with a consultation record to key off of.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isTutor = Boolean(
    user && process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL
  );
  if (!isTutor) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const formData = await request.formData();
  const approved = formData.get("approved") === "true";

  const admin = createAdminClient();
  await admin
    .from("clients")
    .update({ approved, approved_at: approved ? new Date().toISOString() : null })
    .eq("id", id);

  // Same-site paths only, so the form can send you back to a client's page.
  const next = new URL(request.url).searchParams.get("next");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/portal/admin/clients";
  return NextResponse.redirect(new URL(target, request.url), { status: 303 });
}
