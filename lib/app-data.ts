import { getSupabaseAdmin } from "./supabase-admin";

export type ProposedActionStatus = "Pending" | "Approved" | "Rejected" | "Needs Clarification" | "Completed" | "Error";

export type ProposedActionSummary = {
  id: string;
  action_type: string;
  title: string;
  description: string | null;
  status: ProposedActionStatus;
  priority: string | null;
  due_at: string | null;
  start_at: string | null;
  end_at: string | null;
  confidence: number;
  reason_summary: string | null;
  raw_json: Record<string, unknown>;
  created_at: string;
  source_items?: {
    source_type: string;
    source_title: string;
    source_excerpt: string | null;
  } | null;
};

export type TaskSummary = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  due_at: string | null;
};

export type ProjectSummary = {
  id: string;
  name: string;
  status: string;
  next_action: string | null;
  updated_at: string;
};

export type GoalSummary = {
  id: string;
  title: string;
  status: string;
  time_horizon: string | null;
};

export type MemorySummary = {
  id: string;
  text: string;
  category: string;
  status: string;
  sensitivity: string;
  confidence: number;
};

export type IntegrationSummary = {
  id: string;
  provider: string;
  status: string;
  account_label: string | null;
  last_synced_at: string | null;
};

export type DashboardData = {
  configured: boolean;
  pendingActions: ProposedActionSummary[];
  tasks: TaskSummary[];
  projects: ProjectSummary[];
  goals: GoalSummary[];
  memories: MemorySummary[];
  integrations: IntegrationSummary[];
  counts: {
    pendingApprovals: number;
    overdueTasks: number;
    activeProjects: number;
    activeMemories: number;
  };
};

const emptyData: DashboardData = {
  configured: false,
  pendingActions: [],
  tasks: [],
  projects: [],
  goals: [],
  memories: [],
  integrations: [],
  counts: {
    pendingApprovals: 0,
    overdueTasks: 0,
    activeProjects: 0,
    activeMemories: 0
  }
};

function asArray<T>(value: T[] | null): T[] {
  return Array.isArray(value) ? value : [];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return emptyData;

  const [actions, tasks, projects, goals, memories, integrations] = await Promise.all([
    supabase
      .from("proposed_actions")
      .select("id, action_type, title, description, status, priority, due_at, start_at, end_at, confidence, reason_summary, raw_json, created_at, source_items(source_type, source_title, source_excerpt)")
      .in("status", ["Pending", "Needs Clarification"])
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("tasks").select("id, title, status, priority, due_at").neq("status", "done").order("due_at", { ascending: true, nullsFirst: false }).limit(50),
    supabase.from("projects").select("id, name, status, next_action, updated_at").order("updated_at", { ascending: false }).limit(50),
    supabase.from("goals").select("id, title, status, time_horizon").order("updated_at", { ascending: false }).limit(25),
    supabase.from("memory_facts").select("id, text, category, status, sensitivity, confidence").order("updated_at", { ascending: false }).limit(50),
    supabase.from("integration_accounts").select("id, provider, status, account_label, last_synced_at").order("provider", { ascending: true }).limit(25)
  ]);

  const pendingActions = asArray(actions.data as ProposedActionSummary[] | null);
  const taskRows = asArray(tasks.data as TaskSummary[] | null);
  const projectRows = asArray(projects.data as ProjectSummary[] | null);
  const memoryRows = asArray(memories.data as MemorySummary[] | null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    configured: true,
    pendingActions,
    tasks: taskRows,
    projects: projectRows,
    goals: asArray(goals.data as GoalSummary[] | null),
    memories: memoryRows,
    integrations: asArray(integrations.data as IntegrationSummary[] | null),
    counts: {
      pendingApprovals: pendingActions.length,
      overdueTasks: taskRows.filter((task) => task.due_at && new Date(task.due_at) < today).length,
      activeProjects: projectRows.filter((project) => project.status === "active").length,
      activeMemories: memoryRows.filter((memory) => memory.status === "Active").length
    }
  };
}

