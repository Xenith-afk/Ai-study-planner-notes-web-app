-- Add UPDATE policy for achievements table
CREATE POLICY "Users can update own achievements"
ON public.achievements
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);