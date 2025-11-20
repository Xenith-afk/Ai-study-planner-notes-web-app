import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Sparkles, Target, Coffee, BookOpen, Smile } from "lucide-react";

const motivationalMessages = [
  "You're doing amazing! Keep going! 🌟",
  "Every small step counts. You got this! 💪",
  "Believe in yourself - you're capable of great things! ✨",
  "Learning is a journey, not a race. Take your time! 🎯",
  "Your hard work will pay off. Stay consistent! 🔥",
  "Mistakes are proof you're trying. Keep learning! 📚",
  "You're stronger than you think! 💙",
  "Progress over perfection. You're improving every day! 🌱",
  "Take a break if you need to. Self-care matters! ☕",
  "You're not alone in this journey. Keep pushing! 🤝",
];

const focusTips = [
  "Try the Pomodoro Technique: 25 min focus, 5 min break",
  "Study in a quiet space with minimal distractions",
  "Put your phone on silent or in another room",
  "Stay hydrated - drink water while studying",
  "Take regular breaks to avoid burnout",
  "Use active recall instead of just re-reading",
  "Teach what you learn to someone else",
  "Create visual mind maps for complex topics",
  "Practice spaced repetition for better retention",
  "Get enough sleep - it helps memory consolidation",
];

const miniTasks = [
  "Review one chapter from your notes",
  "Create 5 flashcards for today",
  "Solve 10 practice problems",
  "Summarize what you learned yesterday",
  "Watch an educational video on your topic",
  "Explain a concept to a friend or family member",
  "Take a 15-minute study break",
  "Organize your study materials",
  "Set 3 goals for tomorrow",
  "Review your weak topics list",
];

export const StudyBuddyMode = () => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentTip, setCurrentTip] = useState("");
  const [currentTask, setCurrentTask] = useState("");
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [userName, setUserName] = useState("Friend");

  useEffect(() => {
    fetchUserName();
    generateNewContent();
  }, []);

  const fetchUserName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name.split(" ")[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  const generateNewContent = () => {
    setCurrentMessage(
      motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
    );
    setCurrentTip(focusTips[Math.floor(Math.random() * focusTips.length)]);
    setCurrentTask(miniTasks[Math.floor(Math.random() * miniTasks.length)]);
  };

  const handleCompleteTask = () => {
    setCompletedTasks([...completedTasks, currentTask]);
    generateNewContent();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Study Buddy Mode</h2>
            <p className="text-sm text-muted-foreground">Your personal motivation & support</p>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <Smile className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Hey {userName}! 👋</h3>
            <p className="text-muted-foreground">{currentMessage}</p>
          </div>
        </div>
      </Card>

      {/* Mini Task */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Today's Mini Task</h3>
            <p className="text-muted-foreground mb-4">{currentTask}</p>
            <div className="flex gap-2">
              <Button onClick={handleCompleteTask} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Mark Complete
              </Button>
              <Button variant="outline" onClick={generateNewContent}>
                Get New Task
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Focus Tip */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Focus Tip of the Day</h3>
            <p className="text-muted-foreground">{currentTip}</p>
          </div>
        </div>
      </Card>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-3">
                Completed Today ({completedTasks.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {completedTasks.map((task, idx) => (
                  <Badge key={idx} variant="secondary">
                    ✓ {task}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Encouraging Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">{completedTasks.length}</div>
          <div className="text-sm text-muted-foreground mt-1">Tasks Completed Today</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-green-500">
            {Math.floor(Math.random() * 50) + 20}%
          </div>
          <div className="text-sm text-muted-foreground mt-1">Weekly Progress</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-orange-500">
            {Math.floor(Math.random() * 10) + 1}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Study Streak</div>
        </Card>
      </div>
    </div>
  );
};
