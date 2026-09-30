import SiteHeader from "@/components/SiteHeader";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <div className="portal-shell wrap" style={{ display: "flex" }}>
        <LoginForm />
      </div>
    </>
  );
}
