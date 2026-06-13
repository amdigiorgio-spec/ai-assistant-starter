import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/today", label: "Today" },
  { href: "/inbox", label: "Inbox" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "Tasks" },
  { href: "/calendar", label: "Calendar" },
  { href: "/memory", label: "Memory" },
  { href: "/email", label: "Email" },
  { href: "/settings", label: "Settings" }
];

export default async function AssistantLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">AI Assistant</p>
          <h1>Command Center</h1>
          <p className="muted small">{user.email ?? "Single-user workspace"}</p>
        </div>
        <nav className="nav-list" aria-label="Assistant sections">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </aside>
      <main className="content-shell">{children}</main>
    </div>
  );
}

