import PageTransition from "@/components/PageTransition";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
