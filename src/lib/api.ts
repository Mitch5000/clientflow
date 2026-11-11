import { supabase, isDemoMode } from './supabase';
import { AppData, Project, Task, TeamMember, Activity, User, TaskComment } from '../types';
import { getSeedData } from '../data/seed';

/* ---------- Row shapes (snake_case, as stored in Postgres) ---------- */
type ProjectRow = { id: string; name: string; description: string; status: string; progress: number; start_date: string; end_date: string; budget: number; client: string; color: string; members: string[]; created_at: string };
type TaskRow = { id: string; title: string; description: string; status: string; priority: string; project_id: string | null; assignee_id: string; due_date: string; created_at: string; pinned: boolean; comments: TaskComment[] };
type MemberRow = { id: string; name: string; email: string; role: string; avatar: string; emoji: string | null; department: string; status: string; joined_at: string };
type ActivityRow = { id: string; type: string; action: string; user_id: string; target_name: string; timestamp: string };
type UserRow = { id: string; name: string; email: string; role: string; avatar: string | null; created_at: string };

/* ---------- mappers: row <-> model ---------- */
const toProject = (r: ProjectRow): Project => ({ id: r.id, name: r.name, description: r.description, status: r.status as Project['status'], progress: r.progress, startDate: r.start_date, endDate: r.end_date, budget: Number(r.budget), client: r.client, color: r.color, members: r.members || [], createdAt: r.created_at });
const fromProject = (p: Project): ProjectRow => ({ id: p.id, name: p.name, description: p.description, status: p.status, progress: p.progress, start_date: p.startDate, end_date: p.endDate, budget: p.budget, client: p.client, color: p.color, members: p.members || [], created_at: p.createdAt });

const toTask = (r: TaskRow): Task => ({ id: r.id, title: r.title, description: r.description, status: r.status as Task['status'], priority: r.priority as Task['priority'], projectId: r.project_id || '', assigneeId: r.assignee_id, dueDate: r.due_date, createdAt: r.created_at, pinned: r.pinned, comments: r.comments || [] });
const fromTask = (t: Task): TaskRow => ({ id: t.id, title: t.title, description: t.description, status: t.status, priority: t.priority, project_id: t.projectId, assignee_id: t.assigneeId, due_date: t.dueDate, created_at: t.createdAt, pinned: !!t.pinned, comments: t.comments || [] });

const toMember = (r: MemberRow): TeamMember => ({ id: r.id, name: r.name, email: r.email, role: r.role, avatar: r.avatar, emoji: r.emoji || undefined, department: r.department, status: r.status as TeamMember['status'], joinedAt: r.joined_at });
const fromMember = (m: TeamMember): MemberRow => ({ id: m.id, name: m.name, email: m.email, role: m.role, avatar: m.avatar, emoji: m.emoji || null, department: m.department, status: m.status, joined_at: m.joinedAt });

const toActivity = (r: ActivityRow): Activity => ({ id: r.id, type: r.type as Activity['type'], action: r.action, userId: r.user_id, targetName: r.target_name, timestamp: r.timestamp });
const fromActivity = (a: Activity): ActivityRow => ({ id: a.id, type: a.type, action: a.action, user_id: a.userId, target_name: a.targetName, timestamp: a.timestamp });

const toUser = (r: UserRow): User => ({ id: r.id, name: r.name, email: r.email, role: r.role, avatar: r.avatar || undefined, createdAt: r.created_at });
const fromUser = (u: User): UserRow => ({ id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar || null, created_at: u.createdAt });

/* partial mappers - only the fields actually provided */
function partialProject(u: Partial<Project>): Partial<ProjectRow> {
  const r: Partial<ProjectRow> = {};
  if (u.name !== undefined) r.name = u.name;
  if (u.description !== undefined) r.description = u.description;
  if (u.status !== undefined) r.status = u.status;
  if (u.progress !== undefined) r.progress = u.progress;
  if (u.startDate !== undefined) r.start_date = u.startDate;
  if (u.endDate !== undefined) r.end_date = u.endDate;
  if (u.budget !== undefined) r.budget = u.budget;
  if (u.client !== undefined) r.client = u.client;
  if (u.color !== undefined) r.color = u.color;
  if (u.members !== undefined) r.members = u.members;
  if (u.createdAt !== undefined) r.created_at = u.createdAt;
  return r;
}
function partialTask(u: Partial<Task>): Partial<TaskRow> {
  const r: Partial<TaskRow> = {};
  if (u.title !== undefined) r.title = u.title;
  if (u.description !== undefined) r.description = u.description;
  if (u.status !== undefined) r.status = u.status;
  if (u.priority !== undefined) r.priority = u.priority;
  if (u.projectId !== undefined) r.project_id = u.projectId;
  if (u.assigneeId !== undefined) r.assignee_id = u.assigneeId;
  if (u.dueDate !== undefined) r.due_date = u.dueDate;
  if (u.createdAt !== undefined) r.created_at = u.createdAt;
  if (u.pinned !== undefined) r.pinned = u.pinned;
  if (u.comments !== undefined) r.comments = u.comments;
  return r;
}
function partialMember(u: Partial<TeamMember>): Partial<MemberRow> {
  const r: Partial<MemberRow> = {};
  if (u.name !== undefined) r.name = u.name;
  if (u.email !== undefined) r.email = u.email;
  if (u.role !== undefined) r.role = u.role;
  if (u.avatar !== undefined) r.avatar = u.avatar;
  if (u.emoji !== undefined) r.emoji = u.emoji || null;
  if (u.department !== undefined) r.department = u.department;
  if (u.status !== undefined) r.status = u.status;
  if (u.joinedAt !== undefined) r.joined_at = u.joinedAt;
  return r;
}

/* ---------- read ---------- */
export async function fetchAll(): Promise<AppData> {
  const [users, members, projects, tasks, activities] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('team_members').select('*'),
    supabase.from('projects').select('*'),
    supabase.from('tasks').select('*'),
    supabase.from('activities').select('*').order('timestamp', { ascending: false }).limit(50),
  ]);
  return {
    users: ((users.data || []) as UserRow[]).map(toUser),
    teamMembers: ((members.data || []) as MemberRow[]).map(toMember),
    projects: ((projects.data || []) as ProjectRow[]).map(toProject),
    tasks: ((tasks.data || []) as TaskRow[]).map(toTask),
    activities: ((activities.data || []) as ActivityRow[]).map(toActivity),
  };
}

/* Populate a fresh Supabase project once, so the live demo isn't empty. */
export async function seedIfEmpty(): Promise<void> {
  const [{ count: pc }, { count: tc }] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('tasks').select('id', { count: 'exact', head: true }),
  ]);
  if ((pc || 0) > 0 || (tc || 0) > 0) return;
  const seed = getSeedData();
  await supabase.from('users').upsert(seed.users.map(fromUser));
  await supabase.from('team_members').upsert(seed.teamMembers.map(fromMember));
  await supabase.from('projects').upsert(seed.projects.map(fromProject));
  await supabase.from('tasks').upsert(seed.tasks.map(fromTask));
  await supabase.from('activities').upsert(seed.activities.map(fromActivity));
}

/* ---------- writes (optimistic UI updates state; these persist) ---------- */
export const insertProject = (p: Project) => supabase.from('projects').insert(fromProject(p));
export const updateProjectRow = (id: string, u: Partial<Project>) => supabase.from('projects').update(partialProject(u)).eq('id', id);
export const deleteProjectRow = (id: string) => supabase.from('projects').delete().eq('id', id);
export const insertTask = (t: Task) => supabase.from('tasks').insert(fromTask(t));
export const updateTaskRow = (id: string, u: Partial<Task>) => supabase.from('tasks').update(partialTask(u)).eq('id', id);
export const deleteTaskRow = (id: string) => supabase.from('tasks').delete().eq('id', id);
export const insertActivity = (a: Activity) => supabase.from('activities').insert(fromActivity(a));
export const updateTeamMemberRow = (id: string, u: Partial<TeamMember>) => supabase.from('team_members').update(partialMember(u)).eq('id', id);
export const upsertUser = (u: User) => supabase.from('users').upsert(fromUser(u));

/* ---------- realtime: live multi-user sync ---------- */
export function subscribeRealtime(onChange: () => void) {
  if (isDemoMode) return null;
  return supabase
    .channel('clientflow-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, onChange)
    .subscribe();
}
