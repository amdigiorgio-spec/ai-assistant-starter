import { getDashboardData } from "@/lib/app-data";
import { EmptyState, PageHeader } from "../ui";

export default async function MemoryPage() {
  const data = await getDashboardData();

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Memory" title="Controlled memory">
        Memories remain proposed until approved. Active memory retrieval is a later phase.
      </PageHeader>
      {data.memories.length === 0 ? (
        <EmptyState title="No memories yet" body="Memory proposals created from manual input will appear after approval processing." />
      ) : (
        <div className="list-panel">
          {data.memories.map((memory) => (
            <div className="list-row" key={memory.id}>
              <strong>{memory.text}</strong>
              <span>{memory.status}</span>
              <span>{memory.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

