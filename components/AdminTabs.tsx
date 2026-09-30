"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/portal/admin/calendar", label: "Calendar" },
  { href: "/portal/admin", label: "Consultations" },
  { href: "/portal/admin/sessions", label: "Sessions" },
  { href: "/portal/admin/scripts", label: "Scripts" },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="admin-tabs">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`admin-tab${pathname === tab.href ? " active" : ""}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
