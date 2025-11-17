import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

interface Topic {
  id: string;
  topic: string;
  subject: string;
  completed: boolean;
  is_weak: boolean;
  confidence_level: number;
}

export const ProgressTracker = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextTopic, setNextTopic] = useState<any>(null);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_tracker')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTopics(data || []);
      
      if (data && data.length > 0) {
        suggestNextTopic(data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error('Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const suggestNextTopic = async (progressData: Topic[]) => {
    try {
      const completedTopics = progressData.filter(t => t.completed).map(t => t.topic);
      const weakTopics = progressData.filter(t => t.is_weak).map(t => t.topic);
      const remainingTopics = progressData.filter(t => !t.completed).map(t => t.topic);

      const { data, error } = await supabase.functions.invoke('suggest-next-topic', {
        body: {
          completedTopics,
          weakTopics,
          remainingTopics,
          targetExam: 'General',
        },
      });

      if (error) throw error;
      setNextTopic(JSON.parse(data.suggestion));
    } catch (error) {
      console.error('Error suggesting topic:', error);
    }
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('progress_tracker')
        .update({ 
          completed: !completed,
          last_reviewed: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      fetchProgress();
      toast.success(completed ? 'Marked as incomplete' : 'Marked as complete!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading progress...</div>;
  }

  const completedCount = topics.filter(t => t.completed).length;
  const progressPercent = topics.length > 0 ? (completedCount / topics.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Overall Progress</h3>
          <Badge variant="secondary" className="text-lg">
            {completedCount}/{topics.length} Complete
          </Badge>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      {nextTopic && (
        <Card className="p-6 border-primary/50 bg-primary/5">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-1" />
            <div>
              <h4 className="font-semibold mb-1">AI Suggestion: Study Next</h4>
              <p className="text-lg font-medium text-primary mb-2">{nextTopic.nextTopic}</p>
              <p className="text-sm text-muted-foreground">{nextTopic.reason}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-3">
        {topics.map((topic) => (
          <Card 
            key={topic.id} 
            className={`p-4 hover:shadow-md transition-all ${
              topic.completed ? 'opacity-60' : ''
            } ${topic.is_weak ? 'border-destructive/50 bg-destructive/5' : ''}`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={topic.completed}
                onCheckedChange={() => toggleComplete(topic.id, topic.completed)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium ${topic.completed ? 'line-through' : ''}`}>
                    {topic.topic}
                  </span>
                  {topic.is_weak && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Weak Area
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{topic.subject}</span>
                  {topic.completed && (
                    <span className="flex items-center gap-1 text-primary">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
