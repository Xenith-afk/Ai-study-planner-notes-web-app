import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, AlertCircle, CheckCircle2, Target, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AnalyticsData {
  insights: string[];
  improvements: string[];
  strengths: string[];
  weeklyGoal: string;
}

export const Analytics = () => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [stats, setStats] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-analytics");
      
      if (error) throw error;
      
      setAnalytics(data.analytics);
      setStats(data.stats);
      toast.success("Analytics updated");
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast.error(error.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const completionRate = stats ? Math.round((stats.completedCount / stats.totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Study Analytics</h2>
          <p className="text-muted-foreground">Track your progress and get personalized insights</p>
        </div>
        <Button onClick={fetchAnalytics} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Completion Rate</span>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">{completionRate}%</p>
              <Progress value={completionRate} className="h-2" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Topics Completed</span>
            </div>
            <p className="text-3xl font-bold">{stats.completedCount}/{stats.totalCount}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="text-sm font-medium">Weak Topics</span>
            </div>
            <p className="text-3xl font-bold">{stats.weakTopicsCount}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Schedule Adherence</span>
            </div>
            <p className="text-3xl font-bold">
              {stats.completedSchedule > 0 
                ? Math.round((stats.completedSchedule / (stats.completedSchedule + stats.skippedSchedule)) * 100)
                : 0}%
            </p>
          </Card>
        </div>
      )}

      {/* AI Insights */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Strengths */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Your Strengths</h3>
            </div>
            <ul className="space-y-2">
              {analytics.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Improvements */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Areas for Improvement</h3>
            </div>
            <ul className="space-y-2">
              {analytics.improvements.map((improvement, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Insights */}
          <Card className="p-6 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
            </div>
            <ul className="space-y-3">
              {analytics.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm p-3 bg-muted/50 rounded-lg">
                  <span className="text-primary mt-1 font-bold">{idx + 1}.</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Weekly Goal */}
          <Card className="p-6 md:col-span-2 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Recommended Weekly Goal</h3>
            </div>
            <p className="text-lg">{analytics.weeklyGoal}</p>
          </Card>
        </div>
      )}

      {loading && !analytics && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};
