import { getDashboardData } from "@/lib/app-data";
import { EmptyState, PageHeader, ProposedActionCard } from "../ui";

export default async function InboxPage() {
  const data = await getDashboardData();

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Inbox" title="Review queue">
        Approve, reject, or ask for clarification. Phase 1 records the decision and audit trail; Phase 2 will expand processing.
      </PageHeader>
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

