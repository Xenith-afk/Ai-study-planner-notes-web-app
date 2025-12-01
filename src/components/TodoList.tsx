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

  const addTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const taskData: any = {
      ...newTask,
      user_id: user.id,
      due_date: newTask.due_date || null,
      recurrence_end_date: newTask.is_recurring && newTask.recurrence_end_date ? newTask.recurrence_end_date : null,
    };

    if (newTask.is_recurring && newTask.due_date) {
      taskData.next_occurrence = calculateNextOccurrence(
        new Date(newTask.due_date),
        newTask.recurrence_pattern,
        newTask.recurrence_interval
      );
    }

    const { error } = await supabase
      .from("tasks")
      .insert(taskData);

    if (error) {
      toast.error("Failed to add task");
      return;
    }

    toast.success(newTask.is_recurring ? "Recurring task created!" : "Task added!");
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>To-Do Tasks</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Optional details"
                  rows={3}
                />
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
                  />
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
                          value={newTask.recurrence_interval}
                          onChange={(e) => setNewTask({ ...newTask, recurrence_interval: parseInt(e.target.value) || 1 })}
                        />
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

              <Button onClick={addTask} className="w-full">Create Task</Button>
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