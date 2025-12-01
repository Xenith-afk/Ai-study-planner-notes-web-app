import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calendar, Target, Plus, LogOut, BarChart3, Zap, Brain, Sparkles, TrendingUp, MessageSquare, Folder, Heart, Trophy, Home as HomeIcon } from "lucide-react";
import { StudyPlanCreator } from "@/components/StudyPlanCreator";
import { ProgressTracker } from "@/components/ProgressTracker";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { MCQPractice } from "@/components/MCQPractice";
import { SmartNotesGenerator } from "@/components/SmartNotesGenerator";
import { Analytics } from "@/components/Analytics";
import { BulkOperations } from "@/components/BulkOperations";
import { ExportMenu } from "@/components/ExportMenu";
import { StudyBuddyChat } from "@/components/StudyBuddyChat";
import { StudyPlanCard } from "@/components/StudyPlanCard";
import { NoteCard } from "@/components/NoteCard";
import { StatsOverview } from "@/components/StatsOverview";
import { CreateNoteDialog } from "@/components/CreateNoteDialog";
import { NotesVault } from "@/components/NotesVault";
import { BadgesAchievements } from "@/components/BadgesAchievements";
import { StudyBuddyMode } from "@/components/StudyBuddyMode";
import { HabitTracker } from "@/components/HabitTracker";
import { TodoList } from "@/components/TodoList";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Determine initial tab from route
  const getInitialTab = () => {
    const path = location.pathname;
    if (path === "/vault") return "vault";
    if (path === "/buddy") return "buddy";
    if (path === "/achievements") return "achievements";
    if (path === "/plans") return "plans";
    if (path === "/practice") return "practice";
    return "overview";
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [notesRes, plansRes] = await Promise.all([
        supabase.from("notes").select("*").order("created_at", { ascending: false }).limit(6),
        supabase.from("study_plans").select("*, study_plan_tasks(*)").order("created_at", { ascending: false }),
      ]);

      if (notesRes.error) throw notesRes.error;
      if (plansRes.error) throw plansRes.error;

      setNotes(notesRes.data || []);
      setStudyPlans(plansRes.data || []);
    } catch (error: any) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleNoteCreated = () => {
    fetchData();
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="shrink-0"
              >
                <HomeIcon className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  StudyFlow AI
                </h1>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <SmartNotesGenerator onNotesGenerated={fetchData} />
              </div>
              <ExportMenu />
              <Button 
                className="gap-2"
                onClick={() => setIsCreateNoteOpen(true)}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Note</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full"
                onClick={signOut}
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <StatsOverview 
          totalNotes={notes.length}
          totalPlans={studyPlans.length}
          completedTasks={studyPlans.reduce((acc, plan) => acc + (plan.study_plan_tasks?.filter((t: any) => t.completed).length || 0), 0)}
          totalTasks={studyPlans.reduce((acc, plan) => acc + (plan.study_plan_tasks?.length || 0), 0)}
        />

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-13 max-w-7xl mx-auto gap-1 overflow-x-auto">
            <TabsTrigger value="overview" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Plans</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="practice" className="gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Practice</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Bulk AI</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">AI Chat</span>
            </TabsTrigger>
            <TabsTrigger value="vault" className="gap-2">
              <Folder className="w-4 h-4" />
              <span className="hidden sm:inline">Vault</span>
            </TabsTrigger>
            <TabsTrigger value="buddy" className="gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Buddy</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="habits" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Habits</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">AI Study Assistant</h3>
                  <p className="text-muted-foreground mb-4">
                    Get personalized study recommendations, generate summaries, and create custom study plans with AI.
                  </p>
                  <Button variant="outline" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Try AI Features
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Notes</h3>
                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No notes yet. Create your first note!
                    </p>
                  ) : (
                    notes.slice(0, 2).map((note) => (
                      <NoteCard
                        key={note.id}
                        title={note.title}
                        excerpt={note.ai_summary || note.content?.substring(0, 100) || ""}
                        subject={note.subject}
                        date={formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      />
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Active Study Plans</h3>
                <div className="space-y-3">
                  {studyPlans.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No study plans yet. Create your first plan!
                    </p>
                  ) : (
                    studyPlans.slice(0, 2).map((plan) => {
                      const tasks = plan.study_plan_tasks || [];
                      const completed = tasks.filter((t: any) => t.completed).length;
                      const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
                      return (
                        <StudyPlanCard
                          key={plan.id}
                          title={plan.title}
                          progress={progress}
                          dueDate={plan.due_date ? formatDistanceToNow(new Date(plan.due_date), { addSuffix: true }) : "No due date"}
                          tasksCompleted={completed}
                          totalTasks={tasks.length}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">All Notes</h3>
              <Button variant="outline" size="sm">Filter</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notes.length === 0 ? (
                <p className="text-muted-foreground col-span-full text-center py-8">
                  No notes yet. Create your first note to get started!
                </p>
              ) : (
                notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    title={note.title}
                    excerpt={note.ai_summary || note.content?.substring(0, 150) || ""}
                    subject={note.subject}
                    date={formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Study Plans</h3>
              <StudyPlanCreator onPlanCreated={fetchData} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {studyPlans.length === 0 ? (
                <p className="text-muted-foreground col-span-full text-center py-8">
                  No study plans yet. Create your first plan to organize your learning!
                </p>
              ) : (
                studyPlans.map((plan) => {
                  const tasks = plan.study_plan_tasks || [];
                  const completed = tasks.filter((t: any) => t.completed).length;
                  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
                  return (
                    <StudyPlanCard
                      key={plan.id}
                      title={plan.title}
                      progress={progress}
                      dueDate={plan.due_date ? formatDistanceToNow(new Date(plan.due_date), { addSuffix: true }) : "No due date"}
                      tasksCompleted={completed}
                      totalTasks={tasks.length}
                    />
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="mt-6">
            <ProgressTracker />
          </TabsContent>

          {/* Practice Tab */}
          <TabsContent value="practice" className="space-y-4 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Flashcards</h3>
                <p className="text-muted-foreground mb-4">Review your flashcards for quick revision</p>
                <FlashcardViewer />
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">MCQ Practice</h3>
                <p className="text-muted-foreground mb-4">Test your knowledge with practice questions</p>
                <MCQPractice />
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <Analytics />
          </TabsContent>

          {/* Bulk Operations Tab */}
          <TabsContent value="bulk" className="mt-6">
            <BulkOperations />
          </TabsContent>

          {/* AI Study Buddy Chat Tab */}
          <TabsContent value="chat" className="mt-6">
            <StudyBuddyChat />
          </TabsContent>

          {/* Notes Vault Tab */}
          <TabsContent value="vault" className="mt-6">
            <NotesVault />
          </TabsContent>

          {/* Study Buddy Mode Tab */}
          <TabsContent value="buddy" className="mt-6">
            <StudyBuddyMode />
          </TabsContent>

          {/* Badges & Achievements Tab */}
          <TabsContent value="achievements" className="mt-6">
            <BadgesAchievements />
          </TabsContent>

          {/* Habit Tracker Tab */}
          <TabsContent value="habits" className="mt-6">
            <HabitTracker />
          </TabsContent>

          {/* To-Do Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <TodoList />
          </TabsContent>
        </Tabs>
      </main>

      <CreateNoteDialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen} onNoteCreated={handleNoteCreated} />
    </div>
  );
};

export default Index;
