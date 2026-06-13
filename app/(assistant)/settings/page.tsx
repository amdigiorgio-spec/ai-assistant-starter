import { getDashboardData } from "@/lib/app-data";
import { EmptyState, PageHeader } from "../ui";

export default async function SettingsPage() {
  const data = await getDashboardData();

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Settings" title="Assistant settings">
        Phase 1 documents required environment variables and shows integration status placeholders.
      </PageHeader>
      <section className="section-band">
        <h3>Environment</h3>
        <div className="list-panel">
          <div className="list-row">
            <strong>App base URL</strong>
            <span>{process.env.APP_BASE_URL || "not set"}</span>
          </div>
          <div className="list-row">
            <strong>Timezone</strong>
            <span>{process.env.TIMEZONE || "America/Los_Angeles"}</span>
          </div>
          <div className="list-row">
            <strong>Supabase</strong>
            <span>{data.configured ? "server configured" : "missing server env vars"}</span>
          </div>
        </div>
      </section>
      <section className="section-band">
        <h3>Integrations</h3>
        {data.integrations.length === 0 ? (
          <EmptyState title="No integrations configured" body="Notion, Gmail, Slack, Google Calendar, and Outlook Calendar are later phases." />
        ) : (
          <div className="list-panel">
            {data.integrations.map((integration) => (
              <div className="list-row" key={integration.id}>
                <strong>{integration.provider}</strong>
                <span>{integration.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
