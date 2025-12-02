// Dashboard Types for Project Management

export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';
export type Phase =
  | 'phase_1'
  | 'phase_2'
  | 'phase_3'
  | 'phase_4'
  | 'phase_5'
  | 'phase_6'
  | 'phase_7'
  | 'phase_8'
  | 'phase_9'
  | 'phase_10';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  phase: Phase | null;
  due_date: string | null;
  estimated_hours: number;
  order_index: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  subtasks?: Subtask[];
  labels?: TaskLabel[];
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  order_index: number;
  created_at: string;
}

export interface TaskHistory {
  id: string;
  user_id: string;
  date: string;
  total_tasks: number;
  completed_tasks: number;
  phase: Phase | null;
  created_at: string;
}

export interface TaskLabel {
  id: string;
  task_id: string;
  label: string;
  color: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_reminders: boolean;
  reminder_time: string;
  days_before_due: number;
  created_at: string;
  updated_at: string;
}

// Kanban Board Types
export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

export interface KanbanBoard {
  columns: KanbanColumn[];
}

// Filter Types
export interface TaskFilters {
  search: string;
  phase: Phase | 'all';
  priority: TaskPriority | 'all';
  dueDate: 'all' | 'overdue' | 'today' | 'this_week' | 'this_month';
}

// Analytics Types
export interface BurndownData {
  date: string;
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  idealBurndown: number;
}

export interface PhaseProgress {
  phase: Phase;
  phaseName: string;
  total: number;
  completed: number;
  percentage: number;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgCompletionTime: number; // in hours
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  upcomingDeadlines: Task[];
  overdueCount: number;
}

// Calendar Event Type
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Task;
}

// Phase Display Info
export const PHASE_INFO: Record<Phase, { name: string; description: string; color: string }> = {
  phase_1: { name: 'Phase 1', description: 'Core Infrastructure', color: '#8b5cf6' },
  phase_2: { name: 'Phase 2', description: 'Authentication & Profiles', color: '#06b6d4' },
  phase_3: { name: 'Phase 3', description: 'Crypto Features', color: '#22c55e' },
  phase_4: { name: 'Phase 4', description: 'Membership System', color: '#eab308' },
  phase_5: { name: 'Phase 5', description: 'NFT Integration', color: '#ef4444' },
  phase_6: { name: 'Phase 6', description: 'Voting & Governance', color: '#f97316' },
  phase_7: { name: 'Phase 7', description: 'Charity Features', color: '#ec4899' },
  phase_8: { name: 'Phase 8', description: 'Learning Platform', color: '#14b8a6' },
  phase_9: { name: 'Phase 9', description: 'Community Features', color: '#6366f1' },
  phase_10: { name: 'Phase 10', description: 'Launch & Polish', color: '#a855f7' },
};

export const STATUS_INFO: Record<TaskStatus, { name: string; color: string }> = {
  backlog: { name: 'Backlog', color: '#6b7280' },
  in_progress: { name: 'In Progress', color: '#3b82f6' },
  review: { name: 'Review', color: '#eab308' },
  done: { name: 'Done', color: '#22c55e' },
};

export const PRIORITY_INFO: Record<TaskPriority, { name: string; emoji: string; color: string }> = {
  high: { name: 'High', emoji: '🔴', color: '#ef4444' },
  medium: { name: 'Medium', emoji: '🟡', color: '#eab308' },
  low: { name: 'Low', emoji: '🟢', color: '#22c55e' },
};

// Initial/Default values
export const DEFAULT_TASK: Partial<Task> = {
  status: 'backlog',
  priority: 'medium',
  estimated_hours: 0,
  order_index: 0,
};

export const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  phase: 'all',
  priority: 'all',
  dueDate: 'all',
};
