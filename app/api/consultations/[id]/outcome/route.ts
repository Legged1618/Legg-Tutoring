import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { setClientApproval } from "@/lib/clients";

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
  const outcome = formData.get("outcome");
  if (outcome !== "good_fit" && outcome !== "not_a_fit") {
    return NextResponse.json({ error: "Invalid outcome." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: consultation, error: fetchError } = await admin
    .from("consultations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !consultation) {
    return NextResponse.json({ error: "Consultation not found." }, { status: 404 });
  }

  await admin
    .from("consultations")
    .update({ outcome, status: "completed" })
    .eq("id", id);

  // Every consultation is auto-approved at booking time already; this is
  // just the tutor's ability to revoke access if it turns out not to be a
  // fit after all (or re-affirm it after reconsidering).
  await setClientApproval(admin, {
    email: consultation.email,
    fullName: consultation.full_name,
    phone: consultation.phone,
    approved: outcome === "good_fit",
  });

  const redirectUrl = new URL("/portal/admin", request.url);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
