import { getDashboardData } from "@/lib/app-data";
import { EmptyState, Metric, PageHeader, ProposedActionCard } from "../ui";
import { QuickAddForm } from "../quick-add-form";

export default async function TodayPage() {
  const data = await getDashboardData();
  const topTasks = data.tasks.slice(0, 5);

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Today" title="Daily command view">
        Calendar integrations land later. Phase 1 focuses on capture, review, and the private app foundation.
      </PageHeader>

      <section className="metrics-grid">
        <Metric label="Pending approvals" value={data.counts.pendingApprovals} />
        <Metric label="Overdue tasks" value={data.counts.overdueTasks} />
        <Metric label="Active projects" value={data.counts.activeProjects} />
        <Metric label="Active memories" value={data.counts.activeMemories} />
      </section>

      <section className="section-band">
        <h3>Quick add</h3>
        <QuickAddForm />
      </section>

      <section className="two-column">
        <div>
          <h3>Top tasks</h3>
          {topTasks.length === 0 ? (
            <EmptyState title="No tasks yet" body="Approved task proposals will appear here." />
          ) : (
            <div className="list-panel">
              {topTasks.map((task) => (
                <div className="list-row" key={task.id}>
                  <strong>{task.title}</strong>
                  <span>{task.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3>Newest proposals</h3>
          {data.pendingActions.length === 0 ? (
            <EmptyState title="Review queue is clear" body="Manual capture will create pending proposals here." />
          ) : (
            <div className="card-list compact-list">
              {data.pendingActions.slice(0, 2).map((action) => (
                <ProposedActionCard key={action.id} action={action} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

