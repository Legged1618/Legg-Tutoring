import SiteHeader from "@/components/SiteHeader";
import { createAdminClient } from "@/lib/supabase/server";

export default async function CancelConsultationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { id } = await params;
  const { cancelled } = await searchParams;

  const admin = createAdminClient();
  const { data: consultation } = await admin
    .from("consultations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return (
    <>
      <SiteHeader />
      <div className="portal-shell wrap" style={{ display: "flex" }}>
        <div className="portal-card">
          <h1>Cancel consultation</h1>

          {!consultation ? (
            <p className="notice error">
              We couldn&apos;t find that consultation. It may already be cancelled.
            </p>
          ) : cancelled === "1" || consultation.status === "cancelled" ? (
            <p className="notice success">
              Your consultation has been cancelled. No action needed on your end.
            </p>
          ) : consultation.status !== "scheduled" ? (
            <p className="notice">This consultation can&apos;t be cancelled anymore.</p>
          ) : (
            <>
              <p className="notice" style={{ marginBottom: 20 }}>
                {consultation.full_name}&apos;s free consultation on{" "}
                {new Date(consultation.scheduled_at).toLocaleString("en-US", {
                  timeZone: process.env.TUTOR_TIMEZONE || "America/New_York",
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </p>
              <form action={`/api/consultations/${id}/cancel`} method="post">
                <button className="btn btn-secondary" type="submit">
                  Cancel this consultation
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
