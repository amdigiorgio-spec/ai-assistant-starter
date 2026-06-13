import { EmptyState, PageHeader } from "../ui";

export default function EmailPage() {
  return (
    <div className="page-stack">
      <PageHeader eyebrow="Email Review" title="Email intake">
        Gmail intake, forwarded-email parsing, and spam/newsletter candidates are intentionally outside Phase 1.
      </PageHeader>
      <EmptyState title="Gmail is not connected yet" body="Phase 1 only provides the data model and protected app surface." />
    </div>
  );
}

