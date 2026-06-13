# Notion setup

Create a page in Notion called **AI Assistant Home**.

Inside it, create a database called **Proposed Actions**.

Use these exact property names and types for the starter app:

| Property name | Type | Notes |
|---|---|---|
| Name | Title | Required by Notion |
| Status | Select | Pending, Approved, Rejected, Needs Clarification, Completed |
| Action Type | Select | task, calendar_event, reminder, journal_entry, goal, memory |
| Priority | Select | none, low, medium, high |
| Due Date | Date | Used for task due dates, reminders, and memory expiry |
| Start Time | Date | Calendar event start |
| End Time | Date | Calendar event end |
| Confidence | Number | 0 to 1 |
| AI Summary | Text | Short explanation |
| Description | Text | Detail from extracted action |
| Original Text | Text | Source excerpt |
| Source Type | Select | manual, gmail, forwarded_email, slack, google_calendar, outlook_calendar, calendar_request |
| Source Title | Text | Subject/title/source label |
| Supabase ID | Text | Links Notion row back to Supabase |
| Raw JSON | Text | Debug payload |
| Processed At | Date | Used later by approval processor |
| Error | Text | Used later for errors |

Then create a Notion integration:

1. Go to Notion's developer area.
2. Create an internal integration.
3. Copy the integration secret into `.env.local` as `NOTION_TOKEN`.
4. Open your **AI Assistant Home** page in Notion.
5. Share the page/database with your integration.
6. Copy the Proposed Actions database ID into `.env.local` as `NOTION_PROPOSED_ACTIONS_DATABASE_ID`.

Tip: the database ID is usually the long string in the Notion database URL.
