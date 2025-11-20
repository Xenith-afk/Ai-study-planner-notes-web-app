import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  BookOpen,
  Brain,
  Calendar,
  FileText,
  Upload,
  LogOut,
  Trophy,
  Heart,
  Folder,
  Sparkles,
} from "lucide-react";

const Home = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userPrefs, setUserPrefs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkOnboarding();
    }
  }, [user]);

  const checkOnboarding = async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (!data || !data.onboarding_completed) {
        navigate("/onboarding");
      } else {
        setUserPrefs(data);
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const actions = [
    {
      title: "Generate Notes",
      description: "AI-powered notes from any topic or PDF",
      icon: BookOpen,
      gradient: "from-blue-500 to-cyan-500",
      action: () => navigate("/ai-room?mode=notes"),
    },
    {
      title: "Solve Doubts",
      description: "Ask any question, get instant answers",
      icon: Brain,
      gradient: "from-purple-500 to-pink-500",
      action: () => navigate("/ai-room?mode=chat"),
    },
    {
      title: "Plan My Study",
      description: "Create personalized study schedules",
      icon: Calendar,
      gradient: "from-orange-500 to-red-500",
      action: () => navigate("/plans"),
    },
    {
      title: "Revise This",
      description: "Flashcards, summaries & quick review",
      icon: Sparkles,
      gradient: "from-green-500 to-emerald-500",
      action: () => navigate("/practice"),
    },
    {
      title: "Upload PDF",
      description: "Convert PDFs to structured notes",
      icon: Upload,
      gradient: "from-indigo-500 to-blue-500",
      action: () => navigate("/ai-room?mode=pdf"),
    },
  ];

  const quickAccess = [
    {
      title: "Notes Vault",
      icon: Folder,
      action: () => navigate("/vault"),
    },
    {
      title: "Study Buddy",
      icon: Heart,
      action: () => navigate("/buddy"),
    },
    {
      title: "Achievements",
      icon: Trophy,
      action: () => navigate("/achievements"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  StudyFlow AI
                </h1>
                {userPrefs && (
                  <p className="text-xs text-muted-foreground">
                    {userPrefs.class_course} • {userPrefs.target_exam}
                  </p>
                )}
              </div>
            </div>

            <Button variant="outline" size="icon" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Message */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">What would you like to do today?</h2>
          <p className="text-muted-foreground">
            Choose an action below to start your study session
          </p>
        </div>

        {/* Main Actions - 5 Big Buttons */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Card
                key={idx}
                className="p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={action.action}
              >
                <div className="space-y-4">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Access */}
        <div className="max-w-5xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">Quick Access</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {quickAccess.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Button
                  key={idx}
                  variant="outline"
                  className="h-20 gap-3 text-left justify-start"
                  onClick={item.action}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
