-- Project Management Dashboard Tables
-- Run this SQL in your Supabase SQL Editor

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  phase TEXT CHECK (phase IN ('phase_1', 'phase_2', 'phase_3', 'phase_4', 'phase_5', 'phase_6', 'phase_7', 'phase_8', 'phase_9', 'phase_10')),
  due_date DATE,
  estimated_hours INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task history for burndown charts
CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  phase TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date, phase)
);

-- Task labels for additional categorization
CREATE TABLE IF NOT EXISTS task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  color TEXT DEFAULT '#8b5cf6'
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_reminders BOOLEAN DEFAULT TRUE,
  reminder_time TIME DEFAULT '09:00:00',
  days_before_due INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for subtasks
CREATE POLICY "Users can view subtasks of their tasks"
  ON subtasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can create subtasks for their tasks"
  ON subtasks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can update subtasks of their tasks"
  ON subtasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can delete subtasks of their tasks"
  ON subtasks FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid()));

-- RLS Policies for task_history
CREATE POLICY "Users can view their own task history"
  ON task_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task history"
  ON task_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task history"
  ON task_history FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for task_labels
CREATE POLICY "Users can view labels of their tasks"
  ON task_labels FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can create labels for their tasks"
  ON task_labels FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can update labels of their tasks"
  ON task_labels FOR UPDATE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Users can delete labels of their tasks"
  ON task_labels FOR DELETE
  USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = auth.uid()));

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_user_date ON task_history(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to record task history daily
CREATE OR REPLACE FUNCTION record_daily_task_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert task history for today
  INSERT INTO task_history (user_id, date, total_tasks, completed_tasks, phase)
  SELECT
    NEW.user_id,
    CURRENT_DATE,
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'done'),
    phase
  FROM tasks
  WHERE user_id = NEW.user_id
  GROUP BY user_id, phase
  ON CONFLICT (user_id, date, phase)
  DO UPDATE SET
    total_tasks = EXCLUDED.total_tasks,
    completed_tasks = EXCLUDED.completed_tasks;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER record_task_history_on_change
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION record_daily_task_history();
