import { getDashboardData } from "@/lib/app-data";
import { EmptyState, PageHeader } from "../ui";

export default async function TasksPage() {
  const data = await getDashboardData();

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Tasks" title="Task list">
        Approved task proposals will become durable tasks here.
      </PageHeader>
      {data.tasks.length === 0 ? (
        <EmptyState title="No approved tasks yet" body="Use quick add, then approve task proposals from the inbox." />
      ) : (
        <div className="list-panel">
          {data.tasks.map((task) => (
            <div className="list-row" key={task.id}>
              <strong>{task.title}</strong>
              <span>{task.status}</span>
              <span>{task.due_at ? new Date(task.due_at).toLocaleDateString() : "No due date"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

