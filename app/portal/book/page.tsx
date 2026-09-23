import SessionBooking from "@/components/SessionBooking";

export default function BookSessionPage() {
  return (
    <div className="portal-shell wrap" style={{ display: "flex" }}>
      <div className="portal-card" style={{ maxWidth: 520 }}>
        <h1>Book a session</h1>
        <SessionBooking />
        <p className="policy-note">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>
      </div>
    </div>
  );
}
