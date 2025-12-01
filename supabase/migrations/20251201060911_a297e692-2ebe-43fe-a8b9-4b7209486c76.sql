-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_reminders_enabled BOOLEAN DEFAULT true,
  habit_reminders_enabled BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '09:00:00',
  daily_summary_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for notification preferences
CREATE POLICY "Users can view own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- task_reminder, habit_reminder, achievement, milestone
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  related_id UUID, -- id of related task/habit/achievement
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Add recurring task fields to tasks table
ALTER TABLE public.tasks 
  ADD COLUMN is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN recurrence_pattern TEXT, -- daily, weekly, monthly
  ADD COLUMN recurrence_interval INTEGER DEFAULT 1,
  ADD COLUMN recurrence_end_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD COLUMN next_occurrence TIMESTAMP WITH TIME ZONE;

-- Create productivity metrics table
CREATE TABLE public.productivity_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  habits_completed INTEGER DEFAULT 0,
  study_time_minutes INTEGER DEFAULT 0,
  focus_score INTEGER DEFAULT 0, -- 0-100
  productivity_score INTEGER DEFAULT 0, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.productivity_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for productivity metrics
CREATE POLICY "Users can manage own productivity metrics"
  ON public.productivity_metrics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create triggers for updating timestamps
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_productivity_metrics_updated_at
  BEFORE UPDATE ON public.productivity_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster notification queries
CREATE INDEX idx_notifications_user_id_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_productivity_metrics_user_date ON public.productivity_metrics(user_id, date DESC);