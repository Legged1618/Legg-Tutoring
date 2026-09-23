import SessionBooking from "@/components/SessionBooking";

export default function BookSessionPage() {
  return (
    <div className="portal-shell wrap" style={{ display: "flex" }}>
      <div className="portal-card" style={{ maxWidth: 520 }}>
        <h1>Book a session</h1>
        <SessionBooking />
        <p className="policy-note">
          $65/hour, virtual only. Payment is collected now, before the
          session. Cancel 24+ hours out for a full refund; inside 24 hours a
          flat $10 fee applies. If your tutor cancels, you&apos;re refunded
          in full automatically.
        </p>
      </div>
    </div>
  );
}
