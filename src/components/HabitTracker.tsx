import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CheckCircle2, Circle, Flame } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// Validation schema for habit form
const habitSchema = z.object({
  name: z.string().trim().min(1, "Habit name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  frequency: z.enum(["daily", "weekly"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  icon: z.string().max(4, "Icon must be 4 characters or less")
});

interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  color: string;
  icon: string;
  streak: number;
  best_streak: number;
}

interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
}

export const HabitTracker = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newHabit, setNewHabit] = useState({
    name: "",
    description: "",
    frequency: "daily",
    color: "#8B5CF6",
    icon: "⭐"
  });

  useEffect(() => {
    fetchHabits();
    fetchCompletions();
  }, []);

  const fetchHabits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load habits");
      return;
    }

    setHabits(data || []);
  };

  const fetchCompletions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from("habit_completions")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed_date", today);

    if (error) {
      toast.error("Failed to load completions");
      return;
    }

    setCompletions(data || []);
  };

  const validateAndAddHabit = async () => {
    setErrors({});
    
    const result = habitSchema.safeParse(newHabit);
    
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
      .from("habits")
      .insert({
        name: result.data.name,
        description: result.data.description || null,
        frequency: result.data.frequency,
        color: result.data.color,
        icon: result.data.icon,
        user_id: user.id
      });

    if (error) {
      toast.error("Failed to add habit");
      return;
    }

    toast.success("Habit added!");
    setNewHabit({ name: "", description: "", frequency: "daily", color: "#8B5CF6", icon: "⭐" });
    setErrors({});
    setIsOpen(false);
    fetchHabits();
  };

  const toggleHabit = async (habitId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const isCompleted = completions.some(c => c.habit_id === habitId);

    if (isCompleted) {
      const { error } = await supabase
        .from("habit_completions")
        .delete()
        .eq("habit_id", habitId)
        .eq("completed_date", today);

      if (error) {
        toast.error("Failed to update habit");
        return;
      }
    } else {
      const { error } = await supabase
        .from("habit_completions")
        .insert({
          habit_id: habitId,
          user_id: user.id,
          completed_date: today
        });

      if (error) {
        toast.error("Failed to update habit");
        return;
      }
    }

    fetchCompletions();
    updateStreak(habitId);
  };

  const updateStreak = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const newStreak = habit.streak + 1;
    const newBestStreak = Math.max(newStreak, habit.best_streak);

    const { error } = await supabase
      .from("habits")
      .update({
        streak: newStreak,
        best_streak: newBestStreak
      })
      .eq("id", habitId);

    if (!error) {
      fetchHabits();
    }
  };

  const deleteHabit = async (habitId: string) => {
    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", habitId);

    if (error) {
      toast.error("Failed to delete habit");
      return;
    }

    toast.success("Habit deleted");
    fetchHabits();
  };

  const isHabitCompleted = (habitId: string) => {
    return completions.some(c => c.habit_id === habitId);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Habit Tracker
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setErrors({}); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Habit Name</label>
                <Input
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  placeholder="e.g., Study for 1 hour"
                  maxLength={100}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  placeholder="Optional"
                  maxLength={500}
                  className={errors.description ? "border-destructive" : ""}
                />
                {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Frequency</label>
                <Select value={newHabit.frequency} onValueChange={(value) => setNewHabit({ ...newHabit, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Icon</label>
                <Input
                  value={newHabit.icon}
                  onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                  placeholder="⭐"
                  maxLength={4}
                  className={errors.icon ? "border-destructive" : ""}
                />
                {errors.icon && <p className="text-xs text-destructive mt-1">{errors.icon}</p>}
              </div>
              <Button onClick={validateAndAddHabit} className="w-full">Create Habit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {habits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No habits yet. Create one to start building streaks!
            </p>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleHabit(habit.id)}
                    className="flex-shrink-0"
                  >
                    {isHabitCompleted(habit.id) ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{habit.icon}</span>
                      <span className="font-medium">{habit.name}</span>
                    </div>
                    {habit.description && (
                      <p className="text-xs text-muted-foreground">{habit.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-orange-500">
                        <Flame className="w-4 h-4" />
                        <span className="font-bold">{habit.streak}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">streak</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteHabit(habit.id)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
