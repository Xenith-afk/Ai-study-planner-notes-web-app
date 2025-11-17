import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar, Plus, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const StudyPlanCreator = ({ onPlanCreated }: { onPlanCreated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    targetExam: '',
    targetDate: '',
    availableHours: '',
    syllabus: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save study goal
      const { data: goal, error: goalError } = await supabase
        .from('study_goals')
        .insert({
          user_id: user.id,
          target_exam: formData.targetExam,
          target_date: formData.targetDate,
          available_hours_per_day: parseInt(formData.availableHours),
        })
        .select()
        .single();

      if (goalError) throw goalError;

      // Generate AI study plan
      const { data: planData, error: planError } = await supabase.functions.invoke(
        'generate-study-plan',
        {
          body: {
            targetExam: formData.targetExam,
            targetDate: formData.targetDate,
            availableHours: formData.availableHours,
            syllabus: formData.syllabus,
          },
        }
      );

      if (planError) throw planError;

      toast.success('Study plan created successfully!');
      setOpen(false);
      onPlanCreated();
      setFormData({ targetExam: '', targetDate: '', availableHours: '', syllabus: '' });
    } catch (error) {
      console.error('Error creating study plan:', error);
      toast.error('Failed to create study plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Study Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Personalized Study Plan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="targetExam">Target Exam</Label>
            <Input
              id="targetExam"
              placeholder="e.g., JEE Main 2025, NEET, SAT"
              value={formData.targetExam}
              onChange={(e) => setFormData({ ...formData, targetExam: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="targetDate">Target Date</Label>
            <Input
              id="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="availableHours">Available Hours Per Day</Label>
            <Input
              id="availableHours"
              type="number"
              min="1"
              max="24"
              placeholder="4"
              value={formData.availableHours}
              onChange={(e) => setFormData({ ...formData, availableHours: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="syllabus">Syllabus / Topics (one per line)</Label>
            <Textarea
              id="syllabus"
              placeholder="Linear Algebra&#10;Calculus&#10;Probability&#10;Organic Chemistry"
              rows={6}
              value={formData.syllabus}
              onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Generating Plan...' : 'Generate AI Study Plan'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
