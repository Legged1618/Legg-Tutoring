import SessionBooking from "@/components/SessionBooking";

export default async function BookSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { cancelled } = await searchParams;

  return (
    <>
      <div className="portal-shell wrap" style={{ display: "flex" }}>
        <div className="portal-card" style={{ maxWidth: 520 }}>
          <h1>Book a session</h1>
          {cancelled === "1" && (
            <p className="notice" style={{ marginBottom: 16 }}>
              Checkout was cancelled, no charge made. Pick a time below whenever you&apos;re
              ready.
            </p>
          )}
          <SessionBooking />
          <p className="policy-note">
            Sessions are $65 an hour. Cancel your session with at least 24 hours
            notice for a full refund. If you cancel within 24 hours, you&apos;ll
            still receive a full refund for the session with a $10 cancellation
            fee. If your tutor cancels, you&apos;ll be refunded in full
            automatically.
          </p>
        </div>
      </div>
    </>
  );
}
