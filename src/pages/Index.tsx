import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calendar, Target, Sparkles, Plus, Search } from "lucide-react";
import { StudyPlanCard } from "@/components/StudyPlanCard";
import { NoteCard } from "@/components/NoteCard";
import { StatsOverview } from "@/components/StatsOverview";
import { CreateNoteDialog } from "@/components/CreateNoteDialog";

const Index = () => {
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  StudyFlow
                </h1>
                <p className="text-xs text-muted-foreground">AI-Powered Learning</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="rounded-full">
                <Search className="w-4 h-4" />
              </Button>
              <Button 
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                onClick={() => setIsCreateNoteOpen(true)}
              >
                <Plus className="w-4 h-4" />
                New Note
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <StatsOverview />

        {/* Tabs Navigation */}
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto">
            <TabsTrigger value="overview" className="gap-2">
              <Target className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <Calendar className="w-4 h-4" />
              Plans
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
                  <NoteCard
                    title="Introduction to React Hooks"
                    excerpt="Understanding useState, useEffect, and custom hooks..."
                    subject="Computer Science"
                    date="2 hours ago"
                  />
                  <NoteCard
                    title="World War II Timeline"
                    excerpt="Key events from 1939 to 1945..."
                    subject="History"
                    date="Yesterday"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Active Study Plans</h3>
                <div className="space-y-3">
                  <StudyPlanCard
                    title="Final Exam Preparation"
                    progress={65}
                    dueDate="In 5 days"
                    tasksCompleted={13}
                    totalTasks={20}
                  />
                  <StudyPlanCard
                    title="JavaScript Mastery"
                    progress={40}
                    dueDate="In 2 weeks"
                    tasksCompleted={8}
                    totalTasks={20}
                  />
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
              <NoteCard
                title="Introduction to React Hooks"
                excerpt="Understanding useState, useEffect, and custom hooks..."
                subject="Computer Science"
                date="2 hours ago"
              />
              <NoteCard
                title="World War II Timeline"
                excerpt="Key events from 1939 to 1945..."
                subject="History"
                date="Yesterday"
              />
              <NoteCard
                title="Photosynthesis Process"
                excerpt="How plants convert light energy into chemical energy..."
                subject="Biology"
                date="2 days ago"
              />
            </div>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Study Plans</h3>
              <Button className="gap-2 bg-gradient-to-r from-primary to-accent">
                <Plus className="w-4 h-4" />
                Create Plan
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <StudyPlanCard
                title="Final Exam Preparation"
                progress={65}
                dueDate="In 5 days"
                tasksCompleted={13}
                totalTasks={20}
              />
              <StudyPlanCard
                title="JavaScript Mastery"
                progress={40}
                dueDate="In 2 weeks"
                tasksCompleted={8}
                totalTasks={20}
              />
              <StudyPlanCard
                title="Chemistry Fundamentals"
                progress={85}
                dueDate="In 3 days"
                tasksCompleted={17}
                totalTasks={20}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <CreateNoteDialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen} />
    </div>
  );
};

export default Index;
