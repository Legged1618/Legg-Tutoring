import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateClientForUser } from "@/lib/clients";
import PortalHeader from "@/components/PortalHeader";
import PortalDashboardClient from "@/components/PortalDashboardClient";

export default async function PortalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string }>;
}) {
  const { booked } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/login");
  }

  const isTutor = Boolean(
    process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL
  );

  if (isTutor) {
    redirect("/portal/admin");
  }

  const admin = createAdminClient();
  const client = await getOrCreateClientForUser(admin, user);
  const approved = client.approved;

  const { data: sessions } = await admin
    .from("sessions")
    .select("*")
    .eq("client_id", client.id)
    .order("scheduled_at", { ascending: true });

  return (
    <>
      <PortalHeader />
      <div className="portal-shell wrap">
        <div className="section-head">
          <h2>Your sessions</h2>
          <p>{user.email}</p>
        </div>

        <PortalDashboardClient
          approved={approved}
          sessions={sessions ?? []}
          bookedBanner={booked === "1"}
        />
      </div>
    </>
  );
}
