import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

interface MCQ {
  id: string;
  question: string;
  question_type: 'mcq' | 'true_false' | 'fill_blank';
  options: any;
  correct_answer: string;
  explanation: string;
  topic: string;
}

export const MCQPractice = () => {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMCQs();
  }, []);

  const fetchMCQs = async () => {
    try {
      const { data, error } = await supabase
        .from('mcqs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMcqs((data || []) as MCQ[]);
    } catch (error) {
      console.error('Error fetching MCQs:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const isCorrect = selectedAnswer === currentMcq.correct_answer;
    setShowResult(true);
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const nextQuestion = () => {
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      toast.success(`Quiz complete! Score: ${score.correct + 1}/${score.total + 1}`);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading questions...</div>;
  }

  if (mcqs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No questions yet</p>
        <p className="text-sm text-muted-foreground">
          Generate MCQs from your notes to start practicing
        </p>
      </Card>
    );
  }

  const currentMcq = mcqs[currentIndex];
  const isCorrect = selectedAnswer === currentMcq.correct_answer;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          Question {currentIndex + 1} / {mcqs.length}
        </Badge>
        <Badge>Score: {score.correct}/{score.total}</Badge>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Badge className="mb-3">{currentMcq.topic}</Badge>
          <h3 className="text-lg font-medium mb-4">{currentMcq.question}</h3>
        </div>

        {currentMcq.question_type === 'mcq' && (
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            {currentMcq.options && Object.entries(currentMcq.options).map(([key, value]: [string, any]) => (
              <div key={key} className="flex items-center space-x-2 mb-3">
                <RadioGroupItem value={key} id={key} disabled={showResult} />
                <Label 
                  htmlFor={key} 
                  className={`cursor-pointer flex-1 ${
                    showResult && key === currentMcq.correct_answer 
                      ? 'text-primary font-medium' 
                      : showResult && key === selectedAnswer && !isCorrect
                      ? 'text-destructive'
                      : ''
                  }`}
                >
                  {value}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {currentMcq.question_type === 'true_false' && (
          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            <div className="flex items-center space-x-2 mb-3">
              <RadioGroupItem value="true" id="true" disabled={showResult} />
              <Label htmlFor="true" className="cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" disabled={showResult} />
              <Label htmlFor="false" className="cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        )}

        {currentMcq.question_type === 'fill_blank' && (
          <Input
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            placeholder="Type your answer..."
            disabled={showResult}
            className="mt-2"
          />
        )}

        {showResult && (
          <Card className={`mt-6 p-4 ${isCorrect ? 'bg-primary/10 border-primary/50' : 'bg-destructive/10 border-destructive/50'}`}>
            <div className="flex items-start gap-2">
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium mb-2">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
                {!isCorrect && (
                  <p className="text-sm mb-2">
                    Correct answer: {currentMcq.correct_answer}
                  </p>
                )}
                {currentMcq.explanation && (
                  <p className="text-sm text-muted-foreground">{currentMcq.explanation}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="mt-6 flex justify-end">
          {!showResult ? (
            <Button onClick={handleSubmit} disabled={!selectedAnswer}>
              Submit Answer
            </Button>
          ) : (
            <Button onClick={nextQuestion}>
              {currentIndex < mcqs.length - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                'Finish Quiz'
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
