import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, BarChart3, Calendar, Target, Flame } from "lucide-react";
import { toast } from "sonner";

interface ProductivityMetrics {
  date: string;
  tasks_completed: number;
  tasks_created: number;
  habits_completed: number;
  study_time_minutes: number;
  focus_score: number;
  productivity_score: number;
}

export const ProductivityAnalytics = () => {
  const [metrics, setMetrics] = useState<ProductivityMetrics[]>([]);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const daysBack = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data, error } = await supabase
      .from("productivity_metrics")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate.toISOString().split('T')[0])
      .order("date", { ascending: true });

    if (error) {
      toast.error("Failed to load analytics");
      setLoading(false);
      return;
    }

    setMetrics(data || []);
    setLoading(false);
  };

  const calculateStats = () => {
    if (metrics.length === 0) {
      return {
        totalTasks: 0,
        totalHabits: 0,
        avgProductivity: 0,
        totalStudyTime: 0,
        taskCompletion: 0,
        trend: 0,
      };
    }

    const totalTasks = metrics.reduce((sum, m) => sum + m.tasks_completed, 0);
    const totalCreated = metrics.reduce((sum, m) => sum + m.tasks_created, 0);
    const totalHabits = metrics.reduce((sum, m) => sum + m.habits_completed, 0);
    const avgProductivity = metrics.reduce((sum, m) => sum + m.productivity_score, 0) / metrics.length;
    const totalStudyTime = metrics.reduce((sum, m) => sum + m.study_time_minutes, 0);
    const taskCompletion = totalCreated > 0 ? (totalTasks / totalCreated) * 100 : 0;

    // Calculate trend (comparing first half vs second half)
    const midpoint = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, midpoint);
    const secondHalf = metrics.slice(midpoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.productivity_score, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.productivity_score, 0) / secondHalf.length;
    const trend = secondHalfAvg - firstHalfAvg;

    return {
      totalTasks,
      totalHabits,
      avgProductivity: Math.round(avgProductivity),
      totalStudyTime: Math.round(totalStudyTime / 60), // Convert to hours
      taskCompletion: Math.round(taskCompletion),
      trend: Math.round(trend),
    };
  };

  const stats = calculateStats();

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    suffix = "" 
  }: { 
    title: string; 
    value: number; 
    icon: any; 
    trend?: number; 
    suffix?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">
              {value}{suffix}
            </p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {trend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${trend > 0 ? "text-green-500" : "text-red-500"}`}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <p className="text-center text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Productivity Analytics</CardTitle>
              <CardDescription>Track your habits, tasks, and study progress</CardDescription>
            </div>
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tasks Completed"
          value={stats.totalTasks}
          icon={Target}
          trend={stats.trend > 0 ? stats.trend : undefined}
        />
        <StatCard
          title="Habits Completed"
          value={stats.totalHabits}
          icon={Flame}
          trend={stats.trend > 0 ? stats.trend : undefined}
        />
        <StatCard
          title="Study Hours"
          value={stats.totalStudyTime}
          icon={Calendar}
          suffix="h"
        />
        <StatCard
          title="Task Completion Rate"
          value={stats.taskCompletion}
          icon={BarChart3}
          suffix="%"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Productivity Score</CardTitle>
            <CardDescription>Average productivity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Score</span>
                <span className="text-2xl font-bold">{stats.avgProductivity}/100</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-4 rounded-full transition-all"
                  style={{ width: `${stats.avgProductivity}%` }}
                />
              </div>
              {stats.trend !== 0 && (
                <p className="text-sm text-muted-foreground">
                  {stats.trend > 0 ? (
                    <span className="text-green-500">↑ {stats.trend}% improvement</span>
                  ) : (
                    <span className="text-red-500">↓ {Math.abs(stats.trend)}% decline</span>
                  )}
                  {" "}from previous period
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Breakdown</CardTitle>
            <CardDescription>Your recent activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No data yet. Start completing tasks and habits to see your analytics!
                </p>
              ) : (
                metrics.slice(-7).reverse().map((metric) => (
                  <div key={metric.date} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(metric.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {metric.tasks_completed} tasks · {metric.habits_completed} habits
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{metric.productivity_score}</p>
                      <p className="text-xs text-muted-foreground">score</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {metrics.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No analytics data yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete tasks and habits to start tracking your productivity
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};