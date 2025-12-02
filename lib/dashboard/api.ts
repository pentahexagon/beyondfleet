import { supabase } from '@/lib/supabase/client';
import type {
  Task,
  Subtask,
  TaskHistory,
  TaskLabel,
  NotificationPreferences,
  TaskStatus,
  Phase,
  TaskFilters,
  DashboardStats,
  PhaseProgress,
  BurndownData,
} from '@/types/dashboard';

// ============ TASKS ============

export async function getTasks(filters?: Partial<TaskFilters>): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*, subtasks(*), task_labels(*)')
    .order('order_index', { ascending: true });

  if (filters?.phase && filters.phase !== 'all') {
    query = query.eq('phase', filters.phase);
  }

  if (filters?.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.dueDate && filters.dueDate !== 'all') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filters.dueDate) {
      case 'overdue':
        query = query.lt('due_date', today.toISOString().split('T')[0]);
        query = query.neq('status', 'done');
        break;
      case 'today':
        query = query.eq('due_date', today.toISOString().split('T')[0]);
        break;
      case 'this_week': {
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 7);
        query = query.gte('due_date', today.toISOString().split('T')[0]);
        query = query.lte('due_date', endOfWeek.toISOString().split('T')[0]);
        break;
      }
      case 'this_month': {
        const endOfMonth = new Date(today);
        endOfMonth.setDate(today.getDate() + 30);
        query = query.gte('due_date', today.toISOString().split('T')[0]);
        query = query.lte('due_date', endOfMonth.toISOString().split('T')[0]);
        break;
      }
    }
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as Task[]) || [];
}

export async function getTasksByStatus(status: TaskStatus): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, subtasks(*), task_labels(*)')
    .eq('status', status)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return (data as Task[]) || [];
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...task,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const updateData: Partial<Task> = { ...updates };

  // If marking as done, set completed_at
  if (updates.status === 'done' && !updates.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }
  // If moving away from done, clear completed_at
  else if (updates.status && updates.status !== 'done') {
    updateData.completed_at = null;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select('*, subtasks(*), task_labels(*)')
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderTasks(
  taskId: string,
  newStatus: TaskStatus,
  newIndex: number
): Promise<void> {
  // Get all tasks in the target status column
  const { data: columnTasks, error: fetchError } = await supabase
    .from('tasks')
    .select('id, order_index')
    .eq('status', newStatus)
    .order('order_index', { ascending: true });

  if (fetchError) throw fetchError;

  // Build updates array
  const updates: { id: string; order_index: number; status?: TaskStatus }[] = [];

  // Update the moved task
  updates.push({ id: taskId, order_index: newIndex, status: newStatus });

  // Reorder other tasks
  let currentIndex = 0;
  for (const task of columnTasks || []) {
    if (task.id === taskId) continue;
    if (currentIndex === newIndex) currentIndex++;
    updates.push({ id: task.id, order_index: currentIndex });
    currentIndex++;
  }

  // Batch update
  for (const update of updates) {
    await supabase.from('tasks').update(update).eq('id', update.id);
  }
}

// ============ SUBTASKS ============

export async function createSubtask(subtask: Partial<Subtask>): Promise<Subtask> {
  const { data, error } = await supabase
    .from('subtasks')
    .insert(subtask)
    .select()
    .single();

  if (error) throw error;
  return data as Subtask;
}

export async function updateSubtask(id: string, updates: Partial<Subtask>): Promise<Subtask> {
  const { data, error } = await supabase
    .from('subtasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Subtask;
}

export async function deleteSubtask(id: string): Promise<void> {
  const { error } = await supabase.from('subtasks').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleSubtask(id: string, completed: boolean): Promise<Subtask> {
  return updateSubtask(id, { completed });
}

// ============ LABELS ============

export async function addLabel(taskId: string, label: string, color?: string): Promise<TaskLabel> {
  const { data, error } = await supabase
    .from('task_labels')
    .insert({ task_id: taskId, label, color: color || '#8b5cf6' })
    .select()
    .single();

  if (error) throw error;
  return data as TaskLabel;
}

export async function removeLabel(id: string): Promise<void> {
  const { error } = await supabase.from('task_labels').delete().eq('id', id);
  if (error) throw error;
}

// ============ TASK HISTORY (for burndown) ============

export async function getTaskHistory(
  days: number = 30,
  phase?: Phase
): Promise<TaskHistory[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = supabase
    .from('task_history')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (phase) {
    query = query.eq('phase', phase);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as TaskHistory[]) || [];
}

// ============ ANALYTICS ============

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*');

  if (error) throw error;

  const taskList = (tasks as Task[]) || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedTasks = taskList.filter(t => t.status === 'done');
  const overdueTasks = taskList.filter(
    t => t.due_date && new Date(t.due_date) < today && t.status !== 'done'
  );

  // Calculate average completion time
  const completedWithTimes = completedTasks.filter(t => t.completed_at && t.created_at);
  const avgCompletionTime =
    completedWithTimes.length > 0
      ? completedWithTimes.reduce((acc, t) => {
          const created = new Date(t.created_at).getTime();
          const completed = new Date(t.completed_at!).getTime();
          return acc + (completed - created) / (1000 * 60 * 60);
        }, 0) / completedWithTimes.length
      : 0;

  // Tasks by status
  const tasksByStatus = taskList.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    {} as Record<TaskStatus, number>
  );

  // Tasks by priority
  const tasksByPriority = taskList.reduce(
    (acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Upcoming deadlines (next 7 days)
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const upcomingDeadlines = taskList
    .filter(
      t =>
        t.due_date &&
        new Date(t.due_date) >= today &&
        new Date(t.due_date) <= nextWeek &&
        t.status !== 'done'
    )
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  return {
    totalTasks: taskList.length,
    completedTasks: completedTasks.length,
    completionRate:
      taskList.length > 0 ? (completedTasks.length / taskList.length) * 100 : 0,
    avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
    tasksByStatus: {
      backlog: tasksByStatus.backlog || 0,
      in_progress: tasksByStatus.in_progress || 0,
      review: tasksByStatus.review || 0,
      done: tasksByStatus.done || 0,
    },
    tasksByPriority: {
      high: tasksByPriority.high || 0,
      medium: tasksByPriority.medium || 0,
      low: tasksByPriority.low || 0,
    },
    upcomingDeadlines,
    overdueCount: overdueTasks.length,
  };
}

export async function getPhaseProgress(): Promise<PhaseProgress[]> {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('phase, status');

  if (error) throw error;

  const taskList = (tasks as Pick<Task, 'phase' | 'status'>[]) || [];

  const phases: Phase[] = [
    'phase_1', 'phase_2', 'phase_3', 'phase_4', 'phase_5',
    'phase_6', 'phase_7', 'phase_8', 'phase_9', 'phase_10',
  ];

  const phaseNames: Record<Phase, string> = {
    phase_1: 'Core Infrastructure',
    phase_2: 'Auth & Profiles',
    phase_3: 'Crypto Features',
    phase_4: 'Membership System',
    phase_5: 'NFT Integration',
    phase_6: 'Voting & Governance',
    phase_7: 'Charity Features',
    phase_8: 'Learning Platform',
    phase_9: 'Community Features',
    phase_10: 'Launch & Polish',
  };

  return phases.map(phase => {
    const phaseTasks = taskList.filter(t => t.phase === phase);
    const completed = phaseTasks.filter(t => t.status === 'done').length;
    const total = phaseTasks.length;

    return {
      phase,
      phaseName: phaseNames[phase],
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });
}

export async function getBurndownData(
  startDate: Date,
  endDate: Date,
  phase?: Phase
): Promise<BurndownData[]> {
  const history = await getTaskHistory(
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    phase
  );

  if (history.length === 0) return [];

  const firstEntry = history[0];
  const totalScope = firstEntry.total_tasks;
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return history.map((entry, index) => ({
    date: entry.date,
    totalTasks: entry.total_tasks,
    completedTasks: entry.completed_tasks,
    remainingTasks: entry.total_tasks - entry.completed_tasks,
    idealBurndown: Math.max(0, totalScope - (totalScope / days) * index),
  }));
}

// ============ NOTIFICATION PREFERENCES ============

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as NotificationPreferences | null;
}

export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: user.id,
      ...preferences,
    })
    .select()
    .single();

  if (error) throw error;
  return data as NotificationPreferences;
}

// ============ CALENDAR UTILITIES ============

export async function getTasksForCalendar(
  startDate: Date,
  endDate: Date
): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, subtasks(*), task_labels(*)')
    .gte('due_date', startDate.toISOString().split('T')[0])
    .lte('due_date', endDate.toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  if (error) throw error;
  return (data as Task[]) || [];
}

export async function updateTaskDueDate(
  taskId: string,
  newDate: Date
): Promise<Task> {
  return updateTask(taskId, {
    due_date: newDate.toISOString().split('T')[0],
  });
}
