"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminTab = { href: string; label: string; count?: number };

export default function AdminTabsNav({ tabs }: { tabs: AdminTab[] }) {
  const pathname = usePathname();

  return (
    <nav className="admin-tabs" aria-label="Admin sections">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || (tab.href !== "/portal/admin" && pathname.startsWith(`${tab.href}/`));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`admin-tab${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
            {tab.count ? <span className="tab-count">{tab.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
