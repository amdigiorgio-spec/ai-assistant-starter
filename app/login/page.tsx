import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/today");

  return (
    <main className="login-shell">
      <section className="login-panel">
        <p className="eyebrow">Private assistant</p>
        <h1>Sign in</h1>
        <p className="muted">
          This Phase 1 app is built for one owner account. Use the Supabase Auth user you create for yourself.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}

