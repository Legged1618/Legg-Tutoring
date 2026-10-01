import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// The tutor's private notes on a client. Clients never see these.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isTutor = Boolean(user && process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL);
  if (!isTutor) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const formData = await request.formData();
  const notes = String(formData.get("notes") || "").trim();

  const admin = createAdminClient();
  await admin.from("clients").update({ tutor_notes: notes || null }).eq("id", id);

  return NextResponse.redirect(new URL(`/portal/admin/clients/${id}?saved=notes#notes`, request.url), {
    status: 303,
  });
}
