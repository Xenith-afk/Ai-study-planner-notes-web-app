import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteCreated?: () => void;
}

export const CreateNoteDialog = ({ open, onOpenChange, onNoteCreated }: CreateNoteDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let aiSummary = null;
      
      if (content) {
        setGeneratingSummary(true);
        try {
          const { data: summaryData, error: summaryError } = await supabase.functions.invoke("generate-summary", {
            body: { content },
          });

          if (summaryError) {
            console.error("Summary generation failed:", summaryError);
            toast.error("Note saved, but AI summary failed to generate");
          } else {
            aiSummary = summaryData.summary;
          }
        } catch (error) {
          console.error("Summary error:", error);
        } finally {
          setGeneratingSummary(false);
        }
      }

      const { error } = await supabase.from("notes").insert({
        user_id: user.id,
        title,
        content,
        subject,
        ai_summary: aiSummary,
      });

      if (error) throw error;

      toast.success("Note created successfully!");
      onOpenChange(false);
      setTitle("");
      setContent("");
      setSubject("");
      onNoteCreated?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create note");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Add a new note to your study collection with AI-powered summaries.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subject} onValueChange={setSubject} required>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Biology">Biology</SelectItem>
                <SelectItem value="History">History</SelectItem>
                <SelectItem value="Literature">Literature</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your notes here..."
              className="min-h-[200px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">AI Summary</p>
                <p className="text-xs text-muted-foreground">
                  An AI-powered summary will be automatically generated when you save this note.
                </p>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-accent"
            disabled={loading || generatingSummary}
          >
            {generatingSummary ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                Generating AI Summary...
              </>
            ) : loading ? (
              "Creating..."
            ) : (
              "Create Note"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
