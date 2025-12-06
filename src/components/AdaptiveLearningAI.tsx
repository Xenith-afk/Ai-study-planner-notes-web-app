import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Brain, TrendingUp, TrendingDown, Target, Lightbulb, RefreshCw } from "lucide-react";

interface TopicAnalysis {
  topic: string;
  subject: string | null;
  confidence_level: number;
  is_weak: boolean;
  last_reviewed: string | null;
}

interface Recommendation {
  topic: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export const AdaptiveLearningAI = () => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [topics, setTopics] = useState<TopicAnalysis[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: progressData, error } = await supabase
        .from("progress_tracker")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      if (progressData && progressData.length > 0) {
        setTopics(progressData);
        const avgConfidence = progressData.reduce((sum, t) => sum + (t.confidence_level || 0), 0) / progressData.length;
        setOverallProgress(Math.round(avgConfidence));
      }
    } catch (error) {
      toast.error("Failed to fetch progress data");
    } finally {
      setLoading(false);
    }
  };

  const analyzeAndRecommend = async () => {
    setAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to use this feature");
        return;
      }

      // Fetch all user data for analysis
      const [progressRes, flashcardsRes, mcqsRes] = await Promise.all([
        supabase.from("progress_tracker").select("*").eq("user_id", user.id),
        supabase.from("flashcards").select("topic").eq("user_id", user.id),
        supabase.from("mcqs").select("topic").eq("user_id", user.id),
      ]);

      const weakTopics = progressRes.data?.filter(t => t.is_weak || (t.confidence_level || 0) < 50) || [];
      const strongTopics = progressRes.data?.filter(t => !t.is_weak && (t.confidence_level || 0) >= 70) || [];
      const flashcardTopics = [...new Set(flashcardsRes.data?.map(f => f.topic) || [])];
      const mcqTopics = [...new Set(mcqsRes.data?.map(m => m.topic) || [])];

      // Generate AI-powered recommendations
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-analytics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            type: "recommendations",
            weakTopics: weakTopics.map(t => t.topic),
            strongTopics: strongTopics.map(t => t.topic),
            flashcardTopics,
            mcqTopics,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate recommendations");

      const data = await response.json();
      
      // Parse recommendations from AI response
      const recs: Recommendation[] = [];
      
      // Add weak topics as high priority
      weakTopics.slice(0, 3).forEach(t => {
        recs.push({
          topic: t.topic,
          reason: `Low confidence (${t.confidence_level || 0}%) - needs more practice`,
          priority: "high"
        });
      });

      // Add topics not reviewed recently
      const staleTopics = progressRes.data?.filter(t => {
        if (!t.last_reviewed) return true;
        const daysSinceReview = Math.floor((Date.now() - new Date(t.last_reviewed).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceReview > 7;
      }) || [];

      staleTopics.slice(0, 2).forEach(t => {
        if (!recs.find(r => r.topic === t.topic)) {
          recs.push({
            topic: t.topic,
            reason: "Not reviewed recently - time to refresh",
            priority: "medium"
          });
        }
      });

      setRecommendations(recs);
      toast.success("Analysis complete!");
    } catch (error) {
      toast.error("Failed to analyze progress");
    } finally {
      setAnalyzing(false);
    }
  };

  const updateTopicConfidence = async (topic: string, newConfidence: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("progress_tracker")
        .update({ 
          confidence_level: newConfidence,
          is_weak: newConfidence < 50,
          last_reviewed: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .eq("topic", topic);

      if (error) throw error;
      
      toast.success("Progress updated!");
      fetchProgress();
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  const weakTopics = topics.filter(t => t.is_weak || (t.confidence_level || 0) < 50);
  const strongTopics = topics.filter(t => !t.is_weak && (t.confidence_level || 0) >= 70);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-primary" />
            Adaptive Learning Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Mastery</span>
            <span className="font-bold">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{topics.length}</div>
              <div className="text-xs text-muted-foreground">Topics Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{strongTopics.length}</div>
              <div className="text-xs text-muted-foreground">Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">{weakTopics.length}</div>
              <div className="text-xs text-muted-foreground">Need Work</div>
            </div>
          </div>

          <Button 
            onClick={analyzeAndRecommend} 
            disabled={analyzing}
            className="w-full"
          >
            {analyzing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4 mr-2" />
            )}
            {analyzing ? "Analyzing..." : "Get AI Recommendations"}
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-primary" />
              Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <Badge 
                  variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "default" : "secondary"}
                >
                  {rec.priority}
                </Badge>
                <div className="flex-1">
                  <div className="font-medium">{rec.topic}</div>
                  <div className="text-sm text-muted-foreground">{rec.reason}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="w-5 h-5 text-amber-500" />
              Topics Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakTopics.slice(0, 5).map((topic, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10">
                <div>
                  <div className="font-medium">{topic.topic}</div>
                  <div className="text-xs text-muted-foreground">{topic.subject || "General"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={topic.confidence_level || 0} className="w-20 h-2" />
                  <span className="text-sm font-medium w-10">{topic.confidence_level || 0}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Strong Topics */}
      {strongTopics.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Mastered Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {strongTopics.slice(0, 5).map((topic, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-green-500/10">
                <div>
                  <div className="font-medium">{topic.topic}</div>
                  <div className="text-xs text-muted-foreground">{topic.subject || "General"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={topic.confidence_level || 0} className="w-20 h-2" />
                  <span className="text-sm font-medium w-10">{topic.confidence_level || 0}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
