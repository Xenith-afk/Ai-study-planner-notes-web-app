import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  FileQuestion, 
  Clock, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  Play,
  RotateCcw,
  Lightbulb,
  AlertTriangle
} from "lucide-react";
import { useRateLimit } from "@/hooks/useRateLimit";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  topic: string;
}

interface ExamResult {
  total: number;
  correct: number;
  percentage: number;
  timeTaken: number;
  weakTopics: string[];
}

export const MockExamTraining = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [examConfig, setExamConfig] = useState({
    topic: "",
    questionCount: 10,
    timeLimit: 15, // minutes
  });
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [examStarted, setExamStarted] = useState(false);
  const [examComplete, setExamComplete] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const { isLimited, remainingRequests, recordRequest, getTimeUntilReset } = useRateLimit({
    maxRequests: 5,
    windowMs: 300000, // 5 exams per 5 minutes
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (examStarted && !examComplete && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examStarted, examComplete, timeRemaining]);

  const generateExam = async () => {
    if (!examConfig.topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    if (!recordRequest()) {
      const resetMinutes = Math.ceil(getTimeUntilReset() / 60000);
      toast.error(`Rate limit exceeded. Please wait ${resetMinutes} minute(s).`);
      return;
    }

    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to generate exams");
        return;
      }

      // First check if we have existing MCQs for this topic
      const { data: existingMcqs } = await supabase
        .from("mcqs")
        .select("*")
        .eq("user_id", user.id)
        .ilike("topic", `%${examConfig.topic}%`)
        .limit(examConfig.questionCount);

      if (existingMcqs && existingMcqs.length >= examConfig.questionCount) {
        // Use existing MCQs
        const shuffled = existingMcqs.sort(() => Math.random() - 0.5).slice(0, examConfig.questionCount);
        setQuestions(shuffled.map(m => ({
          id: m.id,
          question: m.question,
          options: Array.isArray(m.options) ? m.options.map(String) : [],
          correct_answer: m.correct_answer,
          explanation: m.explanation,
          topic: m.topic,
        })));
        toast.success("Exam ready!");
      } else {
        // Generate new questions using AI
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mcqs`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              topic: examConfig.topic,
              count: examConfig.questionCount,
              difficulty: "mixed",
            }),
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            toast.error("Rate limit reached. Please try again in a moment.");
            return;
          }
          throw new Error("Failed to generate questions");
        }

        const data = await response.json();
        
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions.map((q: any, idx: number) => ({
            id: `gen-${idx}`,
            question: q.question,
            options: q.options || [],
            correct_answer: q.correct_answer || q.correctAnswer,
            explanation: q.explanation,
            topic: examConfig.topic,
          })));
          toast.success("Exam generated!");
        }
      }
    } catch (error) {
      toast.error("Failed to generate exam");
    } finally {
      setGenerating(false);
    }
  };

  const startExam = () => {
    setExamStarted(true);
    setTimeRemaining(examConfig.timeLimit * 60);
    setCurrentIndex(0);
    setAnswers({});
    setExamComplete(false);
    setResult(null);
  };

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const submitExam = () => {
    const totalTime = examConfig.timeLimit * 60 - timeRemaining;
    let correct = 0;
    const topicErrors: Record<string, number> = {};

    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        correct++;
      } else {
        topicErrors[q.topic] = (topicErrors[q.topic] || 0) + 1;
      }
    });

    const weakTopics = Object.entries(topicErrors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);

    setResult({
      total: questions.length,
      correct,
      percentage: Math.round((correct / questions.length) * 100),
      timeTaken: totalTime,
      weakTopics,
    });
    setExamComplete(true);
    setExamStarted(false);
  };

  const resetExam = () => {
    setQuestions([]);
    setExamStarted(false);
    setExamComplete(false);
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
    setShowExplanation(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentIndex];

  // Results view
  if (examComplete && result) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-primary" />
            Exam Results
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Score */}
          <div className="text-center py-6">
            <div className={`text-6xl font-bold mb-2 ${
              result.percentage >= 70 ? "text-green-500" : 
              result.percentage >= 50 ? "text-amber-500" : "text-red-500"
            }`}>
              {result.percentage}%
            </div>
            <p className="text-muted-foreground">
              {result.correct} out of {result.total} correct
            </p>
            <p className="text-sm text-muted-foreground">
              Time: {formatTime(result.timeTaken)}
            </p>
          </div>

          {/* Weak topics */}
          {result.weakTopics.length > 0 && (
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                Areas to Improve
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.weakTopics.map((topic, idx) => (
                  <Badge key={idx} variant="outline" className="border-amber-500 text-amber-500">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Review answers */}
          <div>
            <h3 className="font-medium mb-3">Review Answers</h3>
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const isCorrect = answers[q.id] === q.correct_answer;
                return (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      isCorrect ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{q.question}</p>
                        {!isCorrect && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Correct: {q.correct_answer}
                          </p>
                        )}
                        {q.explanation && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-1 h-auto p-0 text-xs"
                            onClick={() => setShowExplanation(!showExplanation)}
                          >
                            <Lightbulb className="w-3 h-3 mr-1" />
                            {showExplanation ? "Hide" : "Show"} explanation
                          </Button>
                        )}
                        {showExplanation && q.explanation && (
                          <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Button onClick={resetExam} className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Take Another Exam
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active exam view
  if (examStarted && currentQuestion) {
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const answered = Object.keys(answers).length;

    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileQuestion className="w-5 h-5 text-primary" />
              Mock Exam
            </CardTitle>
            <Badge variant={timeRemaining < 60 ? "destructive" : "outline"} className="text-lg">
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(timeRemaining)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1}/{questions.length}
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-6 flex flex-col">
          {/* Question */}
          <div className="flex-1">
            <Badge variant="secondary" className="mb-4">{currentQuestion.topic}</Badge>
            <h3 className="text-lg font-medium mb-6">{currentQuestion.question}</h3>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => (
                <Button
                  key={idx}
                  variant={answers[currentQuestion.id] === option ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => selectAnswer(currentQuestion.id, option)}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </Button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <div className="flex-1" />
            {currentIndex < questions.length - 1 ? (
              <Button onClick={() => setCurrentIndex(currentIndex + 1)}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={submitExam}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Exam ({answered}/{questions.length} answered)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Setup view
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileQuestion className="w-5 h-5 text-primary" />
          Mock Exam Training
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Practice with timed exams and get AI feedback
        </p>
        {isLimited && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Rate limit reached. Wait {Math.ceil(getTimeUntilReset() / 60000)} minute(s) before generating more exams.
            </AlertDescription>
          </Alert>
        )}
        {!isLimited && remainingRequests <= 2 && (
          <p className="text-xs text-muted-foreground mt-1">
            {remainingRequests} exam generations remaining
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-6 space-y-6">
        {questions.length === 0 ? (
          // Config form
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic / Subject</Label>
              <Input
                id="topic"
                placeholder="e.g., Photosynthesis, World War II, Algebra"
                value={examConfig.topic}
                onChange={(e) => setExamConfig((prev) => ({ ...prev, topic: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Number of Questions: {examConfig.questionCount}</Label>
              <Slider
                value={[examConfig.questionCount]}
                onValueChange={(v) => setExamConfig((prev) => ({ ...prev, questionCount: v[0] }))}
                min={5}
                max={30}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Time Limit: {examConfig.timeLimit} minutes</Label>
              <Slider
                value={[examConfig.timeLimit]}
                onValueChange={(v) => setExamConfig((prev) => ({ ...prev, timeLimit: v[0] }))}
                min={5}
                max={60}
                step={5}
              />
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={generateExam}
              disabled={generating || !examConfig.topic.trim()}
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating Exam...
                </>
              ) : (
                <>
                  <FileQuestion className="w-4 h-4 mr-2" />
                  Generate Exam
                </>
              )}
            </Button>
          </div>
        ) : (
          // Ready to start
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <FileQuestion className="w-10 h-10 text-primary" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">Exam Ready!</h3>
              <p className="text-muted-foreground">
                {questions.length} questions • {examConfig.timeLimit} minutes
              </p>
              <Badge className="mt-2">{examConfig.topic}</Badge>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetExam}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Change Settings
              </Button>
              <Button size="lg" onClick={startExam}>
                <Play className="w-4 h-4 mr-2" />
                Start Exam
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
