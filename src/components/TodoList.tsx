import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CheckCircle2, Circle, Calendar, Repeat } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { z } from "zod";

// Validation schema for task form
const taskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  priority: z.enum(["low", "medium", "high"]),
  category: z.string().trim().max(50, "Category must be less than 50 characters").default("general"),
  due_date: z.string().optional(),
  is_recurring: z.boolean(),
  recurrence_pattern: z.enum(["daily", "weekly", "monthly"]),
  recurrence_interval: z.number().int().min(1, "Interval must be at least 1").max(365, "Interval must be less than 365"),
  recurrence_end_date: z.string().optional()
});

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  priority: string;
  category: string;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_interval: number;
  recurrence_end_date: string | null;
}

export const TodoList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "general",
    due_date: "",
    is_recurring: false,
    recurrence_pattern: "daily",
    recurrence_interval: 1,
    recurrence_end_date: ""
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load tasks");
      return;
    }

    setTasks(data || []);
  };

  const validateAndAddTask = async () => {
    setErrors({});
    
    const result = taskSchema.safeParse(newTask);
    
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

    const taskData: any = {
      title: result.data.title,
      description: result.data.description || null,
      priority: result.data.priority,
      category: result.data.category || "general",
      user_id: user.id,
      due_date: result.data.due_date || null,
      is_recurring: result.data.is_recurring,
      recurrence_pattern: result.data.is_recurring ? result.data.recurrence_pattern : null,
      recurrence_interval: result.data.recurrence_interval,
      recurrence_end_date: result.data.is_recurring && result.data.recurrence_end_date ? result.data.recurrence_end_date : null,
    };

    if (result.data.is_recurring && result.data.due_date) {
      taskData.next_occurrence = calculateNextOccurrence(
        new Date(result.data.due_date),
        result.data.recurrence_pattern,
        result.data.recurrence_interval
      );
    }

    const { error } = await supabase
      .from("tasks")
      .insert(taskData);

    if (error) {
      toast.error("Failed to add task");
      return;
    }

    toast.success(result.data.is_recurring ? "Recurring task created!" : "Task added!");
    setNewTask({ 
      title: "", 
      description: "", 
      priority: "medium", 
      category: "general", 
      due_date: "",
      is_recurring: false,
      recurrence_pattern: "daily",
      recurrence_interval: 1,
      recurrence_end_date: ""
    });
    setErrors({});
    setIsOpen(false);
    fetchTasks();
  };

  const calculateNextOccurrence = (currentDate: Date, pattern: string, interval: number): string => {
    let nextDate: Date;
    switch (pattern) {
      case "daily":
        nextDate = addDays(currentDate, interval);
        break;
      case "weekly":
        nextDate = addWeeks(currentDate, interval);
        break;
      case "monthly":
        nextDate = addMonths(currentDate, interval);
        break;
      default:
        nextDate = addDays(currentDate, 1);
    }
    return nextDate.toISOString();
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If completing a recurring task, create next occurrence
    if (!completed && task.is_recurring && task.due_date) {
      const nextOccurrence = calculateNextOccurrence(
        new Date(task.due_date),
        task.recurrence_pattern || "daily",
        task.recurrence_interval
      );

      // Check if next occurrence is before end date
      const shouldCreateNext = !task.recurrence_end_date || 
        new Date(nextOccurrence) <= new Date(task.recurrence_end_date);

      if (shouldCreateNext) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("tasks").insert({
            user_id: user.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            category: task.category,
            due_date: nextOccurrence,
            is_recurring: true,
            recurrence_pattern: task.recurrence_pattern,
            recurrence_interval: task.recurrence_interval,
            recurrence_end_date: task.recurrence_end_date,
            parent_task_id: task.id,
          });
        }
      }
    }

    const { error } = await supabase
      .from("tasks")
      .update({ completed: !completed })
      .eq("id", taskId);

    if (error) {
      toast.error("Failed to update task");
      return;
    }

    fetchTasks();
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      toast.error("Failed to delete task");
      return;
    }

    toast.success("Task deleted");
    fetchTasks();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-muted-foreground";
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  const activeCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  const handleIntervalChange = (value: string) => {
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 365) {
      setNewTask({ ...newTask, recurrence_interval: parsed });
    } else if (value === "") {
      setNewTask({ ...newTask, recurrence_interval: 1 });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>To-Do Tasks</CardTitle>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setErrors({}); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Task Title</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g., Complete math assignment"
                  maxLength={200}
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Optional details"
                  rows={3}
                  maxLength={1000}
                  className={errors.description ? "border-destructive" : ""}
                />
                {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    placeholder="general"
                    maxLength={50}
                    className={errors.category ? "border-destructive" : ""}
                  />
                  {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="recurring">Make this a recurring task</Label>
                  <Switch
                    id="recurring"
                    checked={newTask.is_recurring}
                    onCheckedChange={(checked) => setNewTask({ ...newTask, is_recurring: checked })}
                  />
                </div>

                {newTask.is_recurring && (
                  <div className="space-y-4 pl-4 border-l-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Repeat Pattern</label>
                        <Select 
                          value={newTask.recurrence_pattern} 
                          onValueChange={(value) => setNewTask({ ...newTask, recurrence_pattern: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Every</label>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          value={newTask.recurrence_interval}
                          onChange={(e) => handleIntervalChange(e.target.value)}
                          className={errors.recurrence_interval ? "border-destructive" : ""}
                        />
                        {errors.recurrence_interval && <p className="text-xs text-destructive mt-1">{errors.recurrence_interval}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Date (Optional)</label>
                      <Input
                        type="date"
                        value={newTask.recurrence_end_date}
                        onChange={(e) => setNewTask({ ...newTask, recurrence_end_date: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={validateAndAddTask} className="w-full">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({tasks.length})
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("active")}
          >
            Active ({activeCount})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Completed ({completedCount})
          </Button>
        </div>

        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {filter === "completed" ? "No completed tasks yet" : "No tasks yet. Add one to get started!"}
            </p>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${
                  task.completed ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleTask(task.id, task.completed)}
                    className="flex-shrink-0 mt-1"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${task.completed ? "line-through" : ""}`}>
                        {task.title}
                      </span>
                      {task.is_recurring && (
                        <span title="Recurring task">
                          <Repeat className="w-3 h-3 text-primary" />
                        </span>
                      )}
                      <span className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs bg-secondary px-2 py-1 rounded">{task.category}</span>
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.due_date), "MMM dd, yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(task.id)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
