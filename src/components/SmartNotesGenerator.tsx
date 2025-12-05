import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Upload, FileText } from 'lucide-react';

export const SmartNotesGenerator = ({ onNotesGenerated }: { onNotesGenerated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [generatedNotes, setGeneratedNotes] = useState<any>(null);

  const handleGenerateFromTopic = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-notes-from-pdf', {
        body: { topic: topic.trim(), pdfUrl: '' },
      });

      if (error) {
        throw new Error(error.message || 'Failed to invoke function');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data || !data.notes) {
        throw new Error('Invalid response from AI service');
      }

      // Parse the notes - the function now returns both raw and parsed
      let notesData;
      if (data.parsed) {
        notesData = data.parsed;
      } else {
        notesData = typeof data.notes === 'string' ? JSON.parse(data.notes) : data.notes;
      }
      
      setGeneratedNotes(notesData);
      
      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: insertError } = await supabase.from('notes').insert({
          user_id: user.id,
          title: notesData.title || topic,
          subject: topic,
          content: JSON.stringify(notesData),
          ai_summary: 'AI-generated structured notes',
        });
        
        if (insertError) {
          toast.error('Notes generated but failed to save');
          return;
        }
      }

      toast.success('Smart notes generated and saved!');
      onNotesGenerated();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to generate notes. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload PDF to storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('syllabus-pdfs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('syllabus-pdfs')
        .getPublicUrl(fileName);

      // Generate notes from PDF
      const { data, error } = await supabase.functions.invoke('generate-notes-from-pdf', {
        body: { pdfUrl: publicUrl, topic: file.name.replace('.pdf', '') },
      });

      if (error) throw error;

      toast.success('Notes generated from PDF!');
      onNotesGenerated();
    } catch (error) {
      toast.error('Failed to process PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          Smart Notes Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI-Powered Notes Generator</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="topic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="topic">From Topic</TabsTrigger>
            <TabsTrigger value="pdf">From PDF</TabsTrigger>
          </TabsList>
          
          <TabsContent value="topic" className="space-y-4">
            <div>
              <Label htmlFor="topic">Enter Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Photosynthesis, Newton's Laws, Trigonometry"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <Button onClick={handleGenerateFromTopic} disabled={loading} className="w-full">
              {loading ? 'Generating...' : 'Generate Smart Notes'}
            </Button>
          </TabsContent>
          
          <TabsContent value="pdf" className="space-y-4">
            <Card className="p-6 border-dashed">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <Label htmlFor="pdf-upload" className="cursor-pointer">
                    <div className="text-sm font-medium mb-1">Upload PDF</div>
                    <div className="text-xs text-muted-foreground">
                      AI will extract and structure notes
                    </div>
                  </Label>
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    className="mt-4"
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {generatedNotes && (
          <Card className="p-6 bg-primary/5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generated Notes Preview
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Title:</strong> {generatedNotes.title}
              </div>
              {generatedNotes.keyPoints && (
                <div>
                  <strong>Key Points:</strong>
                  <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                    {generatedNotes.keyPoints.map((point: string, i: number) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};
