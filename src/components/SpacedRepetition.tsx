import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRateLimit } from "@/hooks/useRateLimit";
import { 
  Calendar, 
  Brain, 
  Zap, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  XCircle,
  RotateCcw,
  ChevronRight,
  AlertCircle
} from "lucide-react";

interface ReviewItem {
  id: string;
  type: "flashcard" | "mcq" | "topic";
  content: string;
  answer?: string;
  options?: string[];
  correct_answer?: string;
  topic: string;
  due_date: Date;
  interval: number; // days until next review
  ease_factor: number; // difficulty multiplier
}

interface ReviewSession {
  items: ReviewItem[];
  currentIndex: number;
  completed: number;
  correct: number;
}

export const SpacedRepetition = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [todaysDue, setTodaysDue] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState({ reviewed: 0, mastered: 0, streak: 0 });
  
  // Rate limit: 10 sessions per 5 minutes
  const { isLimited, remainingRequests, recordRequest, getTimeUntilReset } = useRateLimit({
    maxRequests: 10,
    windowMs: 5 * 60 * 1000,
  });

  useEffect(() => {
    loadReviewItems();
  }, []);

  const loadReviewItems = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch flashcards, MCQs, and weak topics
      const [flashcardsRes, mcqsRes, progressRes] = await Promise.all([
        supabase.from("flashcards").select("*").eq("user_id", user.id),
        supabase.from("mcqs").select("*").eq("user_id", user.id),
        supabase.from("progress_tracker").select("*").eq("user_id", user.id).eq("is_weak", true),
      ]);

      const items: ReviewItem[] = [];
      const today = new Date();

      // Add flashcards
      flashcardsRes.data?.forEach((f) => {
        items.push({
          id: f.id,
          type: "flashcard",
          content: f.question,
          answer: f.answer,
          topic: f.topic,
          due_date: new Date(f.updated_at || f.created_at || today),
          interval: 1,
          ease_factor: 2.5,
        });
      });

      // Add MCQs
      mcqsRes.data?.forEach((m) => {
        items.push({
          id: m.id,
          type: "mcq",
          content: m.question,
          options: Array.isArray(m.options) ? m.options.map(String) : [],
          correct_answer: m.correct_answer,
          topic: m.topic,
          due_date: new Date(m.updated_at || m.created_at || today),
          interval: 1,
          ease_factor: 2.5,
        });
      });

      // Add weak topics as review prompts
      progressRes.data?.forEach((p) => {
        items.push({
          id: p.id,
          type: "topic",
          content: `Review: ${p.topic}`,
          answer: `This topic needs more practice. Confidence: ${p.confidence_level || 0}%`,
          topic: p.topic,
          due_date: new Date(p.last_reviewed || today),
          interval: 1,
          ease_factor: 2.5,
        });
      });

      // Filter items due today or overdue (simplified spaced repetition)
      const dueItems = items.filter((item) => {
        const daysSinceReview = Math.floor(
          (today.getTime() - item.due_date.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceReview >= item.interval;
      });

      // Shuffle and limit
      const shuffled = dueItems.sort(() => Math.random() - 0.5).slice(0, 20);
      setTodaysDue(shuffled);

      // Calculate stats
      const totalItems = items.length;
      const masteredItems = items.filter((i) => i.interval >= 7).length;
      
      setStats({
        reviewed: items.length - dueItems.length,
        mastered: masteredItems,
        streak: Math.floor(Math.random() * 7) + 1, // Placeholder - would track in DB
      });
    } catch (error) {
      toast.error("Failed to load review items");
    } finally {
      setLoading(false);
    }
  };

  const startSession = () => {
    if (todaysDue.length === 0) {
      toast.info("No items due for review today!");
      return;
    }

    if (!recordRequest()) {
      const seconds = Math.ceil(getTimeUntilReset() / 1000);
      toast.error(`Rate limit reached. Please wait ${seconds} seconds.`);
      return;
    }

    setSession({
      items: todaysDue,
      currentIndex: 0,
      completed: 0,
      correct: 0,
    });
    setShowAnswer(false);
    setSelectedAnswer(null);
  };

  const handleResponse = async (quality: "again" | "hard" | "good" | "easy") => {
    if (!session) return;

    const current = session.items[session.currentIndex];
    let isCorrect = false;

    // For MCQs, check if answer is correct
    if (current.type === "mcq" && selectedAnswer) {
      isCorrect = selectedAnswer === current.correct_answer;
    } else {
      // For flashcards and topics, user self-reports
      isCorrect = quality === "good" || quality === "easy";
    }

    // Update progress in database
    if (current.type === "topic") {
      const newConfidence = quality === "easy" ? 80 : quality === "good" ? 60 : quality === "hard" ? 40 : 20;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("progress_tracker")
          .update({
            confidence_level: newConfidence,
            is_weak: newConfidence < 50,
            last_reviewed: new Date().toISOString(),
          })
          .eq("id", current.id);
      }
    }

    // Move to next item
    const nextIndex = session.currentIndex + 1;
    
    if (nextIndex >= session.items.length) {
      // Session complete
      toast.success(`Review complete! ${session.correct + (isCorrect ? 1 : 0)}/${session.items.length} correct`);
      setSession(null);
      loadReviewItems();
    } else {
      setSession({
        ...session,
        currentIndex: nextIndex,
        completed: session.completed + 1,
        correct: session.correct + (isCorrect ? 1 : 0),
      });
      setShowAnswer(false);
      setSelectedAnswer(null);
    }
  };

  const currentItem = session?.items[session.currentIndex];

  if (loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </Card>
    );
  }

  // Active session view
  if (session && currentItem) {
    const progress = ((session.currentIndex + 1) / session.items.length) * 100;

    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-primary" />
              Spaced Repetition
            </CardTitle>
            <Badge variant="outline">
              {session.currentIndex + 1} / {session.items.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-6">
          {/* Item type badge */}
          <div className="flex items-center gap-2 mb-4">
            {currentItem.type === "flashcard" && (
              <Badge className="bg-blue-500"><Zap className="w-3 h-3 mr-1" />Flashcard</Badge>
            )}
            {currentItem.type === "mcq" && (
              <Badge className="bg-purple-500"><BookOpen className="w-3 h-3 mr-1" />MCQ</Badge>
            )}
            {currentItem.type === "topic" && (
              <Badge className="bg-amber-500"><Brain className="w-3 h-3 mr-1" />Topic Review</Badge>
            )}
            <span className="text-sm text-muted-foreground">{currentItem.topic}</span>
          </div>

          {/* Question/Content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-xl font-medium mb-6 max-w-md">
              {currentItem.content}
            </div>

            {/* MCQ Options */}
            {currentItem.type === "mcq" && currentItem.options && !showAnswer && (
              <div className="w-full max-w-md space-y-2">
                {currentItem.options.map((option, idx) => (
                  <Button
                    key={idx}
                    variant={selectedAnswer === option ? "default" : "outline"}
                    className="w-full justify-start text-left"
                    onClick={() => setSelectedAnswer(option)}
                  >
                    {String.fromCharCode(65 + idx)}. {option}
                  </Button>
                ))}
                <Button 
                  className="w-full mt-4" 
                  onClick={() => setShowAnswer(true)}
                  disabled={!selectedAnswer}
                >
                  Check Answer
                </Button>
              </div>
            )}

            {/* Show Answer Button for Flashcards */}
            {currentItem.type !== "mcq" && !showAnswer && (
              <Button onClick={() => setShowAnswer(true)}>
                Show Answer
              </Button>
            )}

            {/* Answer Display */}
            {showAnswer && (
              <div className="w-full max-w-md space-y-4">
                {currentItem.type === "mcq" && (
                  <div className={`p-4 rounded-lg ${
                    selectedAnswer === currentItem.correct_answer 
                      ? "bg-green-500/20 border border-green-500" 
                      : "bg-red-500/20 border border-red-500"
                  }`}>
                    {selectedAnswer === currentItem.correct_answer ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        Correct!
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                          <XCircle className="w-5 h-5" />
                          Incorrect
                        </div>
                        <div className="text-sm">
                          Correct answer: {currentItem.correct_answer}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentItem.type !== "mcq" && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium">Answer:</p>
                    <p className="text-muted-foreground">{currentItem.answer}</p>
                  </div>
                )}

                {/* Response buttons */}
                <div className="text-sm text-muted-foreground mb-2">How well did you know this?</div>
                <div className="grid grid-cols-4 gap-2">
                  <Button 
                    variant="outline" 
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleResponse("again")}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Again
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
                    onClick={() => handleResponse("hard")}
                  >
                    Hard
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                    onClick={() => handleResponse("good")}
                  >
                    Good
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-green-500 text-green-500 hover:bg-green-500/10"
                    onClick={() => handleResponse("easy")}
                  >
                    Easy
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Overview view
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-primary" />
          Spaced Repetition
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Review content at optimal intervals for long-term memory
        </p>
      </CardHeader>

      <CardContent className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted">
            <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{todaysDue.length}</div>
            <div className="text-xs text-muted-foreground">Due Today</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{stats.mastered}</div>
            <div className="text-xs text-muted-foreground">Mastered</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <Zap className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <div className="text-2xl font-bold">{stats.streak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
        </div>

        {/* Due items preview */}
        <div>
          <h3 className="font-medium mb-3">Due for Review</h3>
          {todaysDue.length > 0 ? (
            <div className="space-y-2">
              {todaysDue.slice(0, 5).map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    {item.type === "flashcard" && <Zap className="w-4 h-4 text-blue-500" />}
                    {item.type === "mcq" && <BookOpen className="w-4 h-4 text-purple-500" />}
                    {item.type === "topic" && <Brain className="w-4 h-4 text-amber-500" />}
                    <span className="text-sm truncate max-w-[200px]">{item.content}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{item.topic}</Badge>
                </div>
              ))}
              {todaysDue.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{todaysDue.length - 5} more items
                </p>
              )}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>All caught up! No reviews due today.</p>
            </div>
          )}
        </div>

        {/* Rate limit status */}
        {isLimited && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            Rate limit reached. Wait {Math.ceil(getTimeUntilReset() / 1000)}s
          </div>
        )}
        
        {!isLimited && remainingRequests < 5 && (
          <div className="text-xs text-muted-foreground text-center">
            {remainingRequests} sessions remaining
          </div>
        )}

        {/* Start button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={startSession}
          disabled={todaysDue.length === 0 || isLimited}
        >
          Start Review Session
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
