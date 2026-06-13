import { getDashboardData } from "@/lib/app-data";
import { EmptyState, PageHeader } from "../ui";

export default async function CalendarPage() {
  const data = await getDashboardData();
  const calendarIntegrations = data.integrations.filter((integration) =>
    ["google_calendar", "outlook_calendar"].includes(integration.provider)
  );

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Calendar Assistant" title="Availability hub">
        Phase 1 prepares the screen and schema. Google and Outlook read-only sync are intentionally later.
      </PageHeader>
      {calendarIntegrations.length === 0 ? (
        <EmptyState title="No calendars connected" body="Google Calendar and Outlook Calendar setup is out of scope for Phase 1." />
      ) : (
        <div className="list-panel">
          {calendarIntegrations.map((integration) => (
            <div className="list-row" key={integration.id}>
              <strong>{integration.provider.replace("_", " ")}</strong>
              <span>{integration.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

