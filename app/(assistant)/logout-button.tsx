"use client";

export function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <button className="secondary-button" type="button" onClick={logout}>
      Sign out
    </button>
  );
}

