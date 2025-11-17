-- Create storage buckets for attachments and PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('note-attachments', 'note-attachments', false),
  ('syllabus-pdfs', 'syllabus-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for note attachments
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'note-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'note-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'note-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for syllabus PDFs
CREATE POLICY "Users can upload their own PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'syllabus-pdfs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'syllabus-pdfs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add tags to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create study goals table
CREATE TABLE IF NOT EXISTS study_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_exam TEXT NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE,
  available_hours_per_day INTEGER,
  syllabus_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE study_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goals"
ON study_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create study schedule table
CREATE TABLE IF NOT EXISTS study_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES study_goals(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  duration_minutes INTEGER,
  completed BOOLEAN DEFAULT false,
  is_weak_topic BOOLEAN DEFAULT false,
  skipped BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE study_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own schedule"
ON study_schedule FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create progress tracker table
CREATE TABLE IF NOT EXISTS progress_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  subject TEXT,
  completed BOOLEAN DEFAULT false,
  is_weak BOOLEAN DEFAULT false,
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE progress_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own progress"
ON progress_tracker FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own flashcards"
ON flashcards FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create MCQs table
CREATE TABLE IF NOT EXISTS mcqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('mcq', 'true_false', 'fill_blank')),
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE mcqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own MCQs"
ON mcqs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_study_goals_updated_at
  BEFORE UPDATE ON study_goals
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_study_schedule_updated_at
  BEFORE UPDATE ON study_schedule
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_progress_tracker_updated_at
  BEFORE UPDATE ON progress_tracker
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON flashcards
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_mcqs_updated_at
  BEFORE UPDATE ON mcqs
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();