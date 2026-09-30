import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateClientForUser } from "@/lib/clients";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const formData = await request.formData();
  const fullName = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  const admin = createAdminClient();
  const client = await getOrCreateClientForUser(admin, user);

  await admin
    .from("clients")
    .update({ full_name: fullName || null, phone: phone || null })
    .eq("id", client.id);

  return NextResponse.redirect(new URL("/portal/profile", request.url), { status: 303 });
}
