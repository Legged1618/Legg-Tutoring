import SessionBooking from "@/components/SessionBooking";
import PortalHeader from "@/components/PortalHeader";

export default async function BookSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { cancelled } = await searchParams;

  return (
    <>
      <PortalHeader />
      <div className="portal-shell wrap" style={{ display: "flex" }}>
        <div className="portal-card" style={{ maxWidth: 520 }}>
          <h1>Book a session</h1>
          {cancelled === "1" && (
            <p className="notice" style={{ marginBottom: 16 }}>
              Checkout was cancelled &mdash; no charge was made. Pick a time below whenever
              you&apos;re ready.
            </p>
          )}
          <SessionBooking />
          <p className="policy-note">
            $65/hour, virtual only. Payment is collected now, before the
            session. Cancel 24+ hours out for a full refund; inside 24 hours a
            flat $10 fee applies. If your tutor cancels, you&apos;re refunded
            in full automatically.
          </p>
        </div>
      </div>
    </>
  );
}
