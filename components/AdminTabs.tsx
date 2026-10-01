import { createAdminClient } from "@/lib/supabase/server";
import AdminTabsNav from "@/components/AdminTabsNav";
import LiveRefresh from "@/components/LiveRefresh";

/**
 * The admin section tabs, with counts for what's waiting on the tutor:
 * consultations still needing a Good fit / Not a fit call, and unread
 * client messages. Only rendered on tutor-gated pages, so it also keeps
 * every admin page fresh without a reload.
 */
export default async function AdminTabs() {
  const admin = createAdminClient();
  const [{ count: pendingConsultations }, { count: unreadMessages }] = await Promise.all([
    admin
      .from("consultations")
      .select("id", { count: "exact", head: true })
      .eq("outcome", "pending")
      .eq("status", "scheduled"),
    admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("sender", "client")
      .is("read_at", null),
  ]);

  return (
    <>
      <LiveRefresh seconds={20} />
      <AdminTabsNav
        tabs={[
          { href: "/portal/admin/calendar", label: "Calendar" },
          { href: "/portal/admin", label: "Consultations", count: pendingConsultations ?? 0 },
          { href: "/portal/admin/sessions", label: "Sessions" },
          { href: "/portal/admin/messages", label: "Messages", count: unreadMessages ?? 0 },
          { href: "/portal/admin/clients", label: "Manage clients" },
          { href: "/portal/admin/notifications", label: "Notifications" },
        ]}
      />
    </>
  );
}
