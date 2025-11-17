import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic: string;
}

export const FlashcardViewer = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlashcards(data || []);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      toast.error('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  if (loading) {
    return <div className="text-center p-8">Loading flashcards...</div>;
  }

  if (flashcards.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No flashcards yet</p>
        <p className="text-sm text-muted-foreground">
          Generate flashcards from your notes to start studying
        </p>
      </Card>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {currentIndex + 1} / {flashcards.length}
        </Badge>
        <Badge>{currentCard.topic}</Badge>
      </div>

      <Card 
        className="p-8 min-h-[300px] flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-all"
        onClick={() => setShowAnswer(!showAnswer)}
      >
        <div className="text-center space-y-4 w-full">
          {!showAnswer ? (
            <>
              <p className="text-sm text-muted-foreground mb-2">Question</p>
              <p className="text-xl font-medium">{currentCard.question}</p>
              <p className="text-sm text-primary mt-8">Click to reveal answer</p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-2">Answer</p>
              <p className="text-xl font-medium text-primary">{currentCard.answer}</p>
            </>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-center gap-4">
        <Button onClick={prevCard} variant="outline" size="icon">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button 
          onClick={() => setShowAnswer(!showAnswer)} 
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          {showAnswer ? 'Show Question' : 'Show Answer'}
        </Button>
        <Button onClick={nextCard} variant="outline" size="icon">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
