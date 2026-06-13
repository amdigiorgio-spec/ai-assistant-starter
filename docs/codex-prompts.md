# Codex prompts to use in order

Use Codex like a developer, not like a magician. Give it one small job at a time.

## Prompt 1: Understand the starter

Explain this repo to me like I am a beginner. Tell me what each folder does, where environment variables go, and how the extract flow works from the form to OpenAI to Supabase to Notion.

## Prompt 2: Make it run locally

Help me run this project locally. Check the dependencies, inspect the README, and tell me the exact commands I should run. If anything is outdated or broken, patch it.

## Prompt 3: Improve the extraction UX

Improve the home page so it displays extracted tasks, events, reminders, journal notes, goals, and memory proposals in clean cards instead of raw JSON. Keep the raw JSON visible in a collapsed debug area.

## Prompt 4: Add Notion approval sync

Add a route that queries the Notion Proposed Actions database for rows where Status = Approved and Processed At is empty. Use the Supabase ID property to update the matching Supabase proposed_actions row to Approved. Do not execute the action yet.

## Prompt 5: Process approved tasks and memories

Update the approval processor so approved tasks create rows in the Supabase tasks table and approved memory proposals create Active rows in memory_facts. Mark each Notion row as Completed after successful processing.

## Prompt 6: Add Google Calendar later

Add Google Calendar support, but only for approved calendar_event rows. Create events only on a separate calendar named AI Assistant. Store the Google Calendar event ID in Supabase and Notion. Do not modify or delete existing events.

## Prompt 7: Add daily digests later

Add morning and evening digest endpoints. Morning digest should summarize today's calendar, open tasks, overdue tasks, and top goals. Evening digest should summarize completed tasks, slipped tasks, tomorrow's preview, and one journal prompt.
