-- Add DELETE policy for notification_preferences table
CREATE POLICY "Users can delete own notification preferences"
ON public.notification_preferences
FOR DELETE
USING (auth.uid() = user_id);