import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ConsultationBooking from "@/components/ConsultationBooking";
import { PRICING } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Book a free consultation | Legg Tutoring",
  description: "Book a free 15-minute phone call with Legg Tutoring.",
};

export default function ConsultationPage() {
  return (
    <>
      <SiteHeader />
      <div className="consult-shell wrap">
        <aside className="consult-note">
          <span className="eyebrow">Free &middot; 15 minutes &middot; By phone</span>
          <h1>Book a free consultation</h1>
          <p>
            A quick phone call so we can get to know each other before any sessions are booked.
            The call is free, with no commitment. Tutoring sessions after it are paid, ${PRICING.virtualHourlyRateCents / 100} an hour, when you book them.
          </p>
          <h2>What we&apos;ll talk about</h2>
          <ul className="check-list">
            <li>The class or subject, and where things stand right now</li>
            <li>What&apos;s been hard, and what the goal is</li>
            <li>Upcoming tests or deadlines</li>
            <li>How sessions work, and a schedule that fits</li>
          </ul>
          <h2>After the call</h2>
          <p>
            Booking this call also sets up your client portal. Sign in with the same email to book
            sessions whenever you&apos;re ready.
          </p>
        </aside>
        <div className="booking-card">
          <h3>Pick a time for your call</h3>
          <ConsultationBooking />
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
