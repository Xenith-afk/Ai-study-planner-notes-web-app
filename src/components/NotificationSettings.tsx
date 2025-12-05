import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// Validation schema for notification preferences
const preferencesSchema = z.object({
  task_reminders_enabled: z.boolean(),
  habit_reminders_enabled: z.boolean(),
  reminder_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  daily_summary_enabled: z.boolean(),
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
});

interface NotificationPreferences {
  task_reminders_enabled: boolean;
  habit_reminders_enabled: boolean;
  reminder_time: string;
  daily_summary_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

interface NotificationSettingsProps {
  onBack: () => void;
}

export const NotificationSettings = ({ onBack }: NotificationSettingsProps) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    task_reminders_enabled: true,
    habit_reminders_enabled: true,
    reminder_time: "09:00",
    daily_summary_enabled: true,
    email_notifications: false,
    push_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      toast.error("Failed to load preferences");
      return;
    }

    if (data) {
      setPreferences({
        task_reminders_enabled: data.task_reminders_enabled,
        habit_reminders_enabled: data.habit_reminders_enabled,
        reminder_time: data.reminder_time,
        daily_summary_enabled: data.daily_summary_enabled,
        email_notifications: data.email_notifications,
        push_notifications: data.push_notifications,
      });
    }
    setLoading(false);
  };

  const savePreferences = async () => {
    setErrors({});
    
    const result = preferencesSchema.safeParse(preferences);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error(result.error.errors[0].message);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        ...result.data,
      });

    if (error) {
      toast.error("Failed to save preferences");
      return;
    }

    toast.success("Notification preferences saved!");
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Clear error for this field when user makes changes
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Notifications
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Customize when and how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Task Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about upcoming tasks
                </p>
              </div>
              <Switch
                checked={preferences.task_reminders_enabled}
                onCheckedChange={(checked) =>
                  updatePreference("task_reminders_enabled", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Habit Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded to complete your daily habits
                </p>
              </div>
              <Switch
                checked={preferences.habit_reminders_enabled}
                onCheckedChange={(checked) =>
                  updatePreference("habit_reminders_enabled", checked)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Daily Reminder Time</Label>
              <Input
                type="time"
                value={preferences.reminder_time}
                onChange={(e) => updatePreference("reminder_time", e.target.value)}
                className={errors.reminder_time ? "border-destructive" : ""}
              />
              {errors.reminder_time && (
                <p className="text-xs text-destructive">{errors.reminder_time}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Choose when you'd like to receive daily reminders
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Daily Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a summary of your daily progress
                </p>
              </div>
              <Switch
                checked={preferences.daily_summary_enabled}
                onCheckedChange={(checked) =>
                  updatePreference("daily_summary_enabled", checked)
                }
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-4">Notification Channels</h4>
              
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <Label>In-App Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show notifications in the notification center
                  </p>
                </div>
                <Switch
                  checked={preferences.push_notifications}
                  onCheckedChange={(checked) =>
                    updatePreference("push_notifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email (coming soon)
                  </p>
                </div>
                <Switch
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) =>
                    updatePreference("email_notifications", checked)
                  }
                  disabled
                />
              </div>
            </div>
          </div>

          <Button onClick={savePreferences} className="w-full">
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
