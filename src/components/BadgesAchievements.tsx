import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Trophy,
  Flame,
  BookOpen,
  Target,
  Star,
  Award,
  Zap,
  Brain,
  Clock,
  CheckCircle2,
} from "lucide-react";

export const BadgesAchievements = () => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    streak: 0,
    totalNotes: 0,
    studyHours: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
    fetchStats();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("unlocked_at", { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [prefsRes, notesRes] = await Promise.all([
        supabase.from("user_preferences").select("*").eq("user_id", user.id).single(),
        supabase.from("notes").select("id").eq("user_id", user.id),
      ]);

      const prefs = prefsRes.data;
      const totalPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0);

      setStats({
        totalPoints,
        streak: prefs?.study_streak || 0,
        totalNotes: notesRes.data?.length || 0,
        studyHours: prefs?.total_study_hours || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const availableBadges = [
    {
      id: "first_note",
      name: "First Steps",
      description: "Create your first note",
      icon: BookOpen,
      unlocked: stats.totalNotes >= 1,
      points: 10,
    },
    {
      id: "5_streak",
      name: "On Fire",
      description: "5-day study streak",
      icon: Flame,
      unlocked: stats.streak >= 5,
      points: 25,
    },
    {
      id: "10_notes",
      name: "Note Collector",
      description: "Create 10 notes",
      icon: Star,
      unlocked: stats.totalNotes >= 10,
      points: 50,
    },
    {
      id: "10_hours",
      name: "Study Marathon",
      description: "10 hours of study time",
      icon: Clock,
      unlocked: stats.studyHours >= 10,
      points: 100,
    },
    {
      id: "dedicated",
      name: "Dedicated Learner",
      description: "30-day study streak",
      icon: Trophy,
      unlocked: stats.streak >= 30,
      points: 200,
    },
    {
      id: "master",
      name: "Knowledge Master",
      description: "50 notes created",
      icon: Award,
      unlocked: stats.totalNotes >= 50,
      points: 300,
    },
  ];

  const unlockedCount = availableBadges.filter((b) => b.unlocked).length;
  const progressPercent = (unlockedCount / availableBadges.length) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Badges & Achievements</h2>
            <p className="text-sm text-muted-foreground">Track your learning journey</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalPoints}</div>
              <div className="text-xs text-muted-foreground">Total Points</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.streak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalNotes}</div>
              <div className="text-xs text-muted-foreground">Notes Created</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.studyHours}h</div>
              <div className="text-xs text-muted-foreground">Study Time</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Progress */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Achievement Progress</h3>
          <span className="text-sm text-muted-foreground">
            {unlockedCount} / {availableBadges.length}
          </span>
        </div>
        <Progress value={progressPercent} />
      </Card>

      {/* Badges Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableBadges.map((badge) => {
          const Icon = badge.icon;
          return (
            <Card
              key={badge.id}
              className={`p-4 ${
                badge.unlocked
                  ? "bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20"
                  : "opacity-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    badge.unlocked
                      ? "bg-gradient-to-br from-primary to-accent"
                      : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      badge.unlocked ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{badge.name}</h3>
                    {badge.unlocked && (
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
                  <Badge variant="secondary" className="mt-2">
                    {badge.points} points
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
