import SiteHeader from "@/components/SiteHeader";
import PageTransition from "@/components/PageTransition";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <PageTransition>{children}</PageTransition>
    </>
  );
}
