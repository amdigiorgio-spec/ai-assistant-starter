import { getDashboardData } from "@/lib/app-data";
import { EmptyState, PageHeader } from "../ui";

export default async function ProjectsPage() {
  const data = await getDashboardData();

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Projects" title="Projects">
        Project records and updates are part of the Phase 1 data model; integrations that feed them come later.
      </PageHeader>
      {data.projects.length === 0 ? (
        <EmptyState title="No projects yet" body="Approved project updates will populate this view." />
      ) : (
        <div className="list-panel">
          {data.projects.map((project) => (
            <div className="list-row" key={project.id}>
              <strong>{project.name}</strong>
              <span>{project.status}</span>
              <span>{project.next_action ?? "No next action"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

