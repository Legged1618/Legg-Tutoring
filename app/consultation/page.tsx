import SiteHeader from "@/components/SiteHeader";
import ConsultationBooking from "@/components/ConsultationBooking";

export default function ConsultationPage() {
  return (
    <>
      <SiteHeader />
      <div className="portal-shell wrap" style={{ display: "flex" }}>
        <div className="booking-card">
          <h3>Book a free 15-minute consultation call</h3>
          <ConsultationBooking />
        </div>
      </div>
    </>
  );
}
