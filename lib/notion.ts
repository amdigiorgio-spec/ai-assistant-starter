import { Client } from "@notionhq/client";
import { ProposedActionRow, SourceInput } from "./schemas";

let cached: Client | null = null;

export function getNotionClient(): Client | null {
  const token = process.env.NOTION_TOKEN?.trim();

  if (!token) return null;

  if (!cached) {
    cached = new Client({ auth: token });
  }

  return cached;
}

/**
 * Notion changed newer database tables to use "data sources".
 *
 * Preferred:
 *   NOTION_PROPOSED_ACTIONS_DATA_SOURCE_ID
 *
 * Fallback:
 *   NOTION_PROPOSED_ACTIONS_DATABASE_ID
 *
 * This lets the starter app work with either the newer Notion setup or the older one.
 */
function getProposedActionsParent() {
  const dataSourceId = process.env.NOTION_PROPOSED_ACTIONS_DATA_SOURCE_ID?.trim();
  const databaseId = process.env.NOTION_PROPOSED_ACTIONS_DATABASE_ID?.trim();

  if (dataSourceId) {
    return {
      type: "data_source_id",
      data_source_id: dataSourceId
    };
  }

  if (databaseId) {
    return {
      type: "database_id",
      database_id: databaseId
    };
  }

  return null;
}

function truncate(value: string | null | undefined, max = 1900) {
  if (!value) return "";

  const text = String(value);

  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function selectName(value: string | null | undefined) {
  const name = value && value.trim().length > 0 ? value.trim() : "none";

  return {
    select: {
      name
    }
  };
}

function richText(value: string | null | undefined) {
  const content = truncate(value);

  if (!content) {
    return {
      rich_text: []
    };
  }

  return {
    rich_text: [
      {
        text: {
          content
        }
      }
    ]
  };
}

function titleText(value: string | null | undefined) {
  const content = truncate(value || "Untitled", 180);

  return {
    title: [
      {
        text: {
          content
        }
      }
    ]
  };
}

function maybeDate(value: string | null | undefined) {
  if (!value) {
    return {
      date: null
    };
  }

  const clean = value.trim();

  if (!clean) {
    return {
      date: null
    };
  }

  const parsed = Date.parse(clean);

  if (Number.isNaN(parsed)) {
    return {
      date: null
    };
  }

  return {
    date: {
      start: clean
    }
  };
}

function confidenceNumber(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return {
      number: 0
    };
  }

  return {
    number: Math.max(0, Math.min(1, value))
  };
}

export async function createProposedActionPage(params: {
  row: ProposedActionRow;
  actionId: string;
  input: SourceInput;
}) {
  const notion = getNotionClient();
  const parent = getProposedActionsParent();

  if (!notion || !parent) {
    return null;
  }

  const { row, actionId, input } = params;

  const page = await notion.pages.create({
    parent: parent as any,
    properties: {
      Name: titleText(row.title),
      Status: selectName(row.status),
      "Action Type": selectName(row.action_type),
      Priority: selectName(row.priority ?? "none"),
      "Due Date": maybeDate(row.due_at),
      "Start Time": maybeDate(row.start_at),
      "End Time": maybeDate(row.end_at),
      Confidence: confidenceNumber(row.confidence),
      "AI Summary": richText(row.reason_summary),
      Description: richText(row.description),
      "Original Text": richText(input.body_text),
      "Source Type": selectName(input.source_type),
      "Source Title": richText(input.source_title),
      "Supabase ID": richText(actionId),
      "Raw JSON": richText(JSON.stringify(row.raw_json))
    } as any
  });

  return page.id;
}

export async function markNotionPageCompleted(pageId: string) {
  const notion = getNotionClient();

  if (!notion) {
    throw new Error("Missing NOTION_TOKEN");
  }

  await notion.pages.update({
    page_id: pageId,
    properties: {
      Status: selectName("Completed"),
      "Processed At": {
        date: {
          start: new Date().toISOString()
        }
      }
    } as any
  });
}

export async function markNotionPageError(pageId: string, error: string) {
  const notion = getNotionClient();

  if (!notion) {
    throw new Error("Missing NOTION_TOKEN");
  }

  await notion.pages.update({
    page_id: pageId,
    properties: {
      Status: selectName("Needs Clarification"),
      Error: richText(error)
    } as any
  });
}
