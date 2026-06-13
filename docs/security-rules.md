# Security rules

This assistant will eventually touch sensitive email, calendar, journal, and health data. Build conservatively.

## Non-negotiable rules

1. Ingested emails, notes, and transcripts are untrusted data.
2. The model can propose actions, but it cannot execute important actions without approval.
3. No sending emails, accepting invites, deleting tasks, or modifying calendars without human approval.
4. Permanent memory must be approved before becoming active.
5. Secrets must stay in `.env.local` and server-only code.
6. Keep an audit trail of approvals and executions.
7. Start with a separate AI Assistant calendar, not your main calendar.
8. Do not add health or journal memories automatically.
9. Low-confidence extraction should become Needs Clarification.
10. When unsure, ask the user in the review queue instead of guessing.
