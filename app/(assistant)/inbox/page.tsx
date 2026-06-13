import { getDashboardData } from "@/lib/app-data";
import { EmptyState, PageHeader, ProposedActionCard } from "../ui";
import Link from "next/link";
import { ProcessApprovedButton } from "../process-approved-button";

const statuses = ["all", "Pending", "Needs Clarification", "Approved", "Completed", "Rejected", "Error"];
const actionTypes = ["all", "task", "project_update", "reminder", "goal", "memory", "calendar_event"];

export default async function InboxPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; actionType?: string }>;
}) {
  const params = await searchParams;
  const data = await getDashboardData({ status: params.status, actionType: params.actionType });

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Inbox" title="Review queue">
        Edit proposals before approval, then process approved items into durable tasks, goals, reminders, project updates, and pending memories.
      </PageHeader>
      <ProcessApprovedButton />
      <section className="filter-bar" aria-label="Review filters">
        <div>
          <span>Status</span>
          {statuses.map((status) => (
            <Link
              key={status}
              className={status === (params.status ?? "Pending") ? "active-filter" : ""}
              href={`/inbox?status=${encodeURIComponent(status)}&actionType=${encodeURIComponent(params.actionType ?? "all")}`}
            >
              {status}
            </Link>
          ))}
        </div>
        <div>
          <span>Type</span>
          {actionTypes.map((actionType) => (
            <Link
              key={actionType}
              className={actionType === (params.actionType ?? "all") ? "active-filter" : ""}
              href={`/inbox?status=${encodeURIComponent(params.status ?? "Pending")}&actionType=${encodeURIComponent(actionType)}`}
            >
              {actionType.replaceAll("_", " ")}
            </Link>
          ))}
        </div>
      </section>
      {data.pendingActions.length === 0 ? (
        <EmptyState title="Nothing waiting" body="New manual captures will appear here as proposed actions." />
      ) : (
        <div className="card-list">
          {data.pendingActions.map((action) => (
            <ProposedActionCard key={action.id} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}
