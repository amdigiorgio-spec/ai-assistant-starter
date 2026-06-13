import { ProposedActionSummary } from "@/lib/app-data";
import { EditProposalForm } from "./edit-proposal-form";
import { ReviewButtons } from "./review-buttons";

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
    </header>
  );
}

export function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

export function ProposedActionCard({ action }: { action: ProposedActionSummary }) {
  const source = action.source_items;

  return (
    <article className="item-card">
      <div className="item-card-header">
        <div>
          <p className="eyebrow">{action.action_type.replaceAll("_", " ")}</p>
          <h3>{action.title}</h3>
        </div>
        <span className="status-pill">{action.status}</span>
      </div>
      {action.description && <p>{action.description}</p>}
      <dl className="meta-grid">
        <div>
          <dt>Confidence</dt>
          <dd>{Math.round(action.confidence * 100)}%</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>{action.priority ?? "none"}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>{action.due_at ? new Date(action.due_at).toLocaleString() : "none"}</dd>
        </div>
      </dl>
      {action.reason_summary && <p className="reason">{action.reason_summary}</p>}
      {source && (
        <blockquote>
          <strong>{source.source_title}</strong>
          <span>{source.source_excerpt ?? source.source_type}</span>
        </blockquote>
      )}
      <details>
        <summary>Raw JSON</summary>
        <pre>{JSON.stringify(action.raw_json, null, 2)}</pre>
      </details>
      <EditProposalForm
        actionId={action.id}
        initialActionType={action.action_type}
        initialTitle={action.title}
        initialDescription={action.description}
        initialPriority={action.priority}
        initialDueAt={action.due_at}
        initialStartAt={action.start_at}
        initialEndAt={action.end_at}
      />
      <ReviewButtons actionId={action.id} status={action.status} />
    </article>
  );
}
