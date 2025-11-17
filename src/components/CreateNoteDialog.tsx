import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RichTextEditor } from "./RichTextEditor";

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteCreated?: () => void;
}

export const CreateNoteDialog = ({ open, onOpenChange, onNoteCreated }: CreateNoteDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: summaryData } = await supabase.functions.invoke("generate-summary", {
        body: { content },
      });

      await supabase.from("notes").insert({
        user_id: user.id,
        title,
        content,
        subject,
        tags,
        ai_summary: summaryData?.summary,
      });

      toast.success("Note created!");
      onOpenChange(false);
      onNoteCreated?.();
    } catch (error: any) {
      toast.error("Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label>Subject</Label>
            <Select value={subject} onValueChange={setSubject} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tags</Label>
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), setTags([...tags, tagInput]), setTagInput(""))} />
            <div className="flex gap-2 mt-2">
              {tags.map(tag => <Badge key={tag}>{tag} <X className="h-3 w-3" onClick={() => setTags(tags.filter(t => t !== tag))} /></Badge>)}
            </div>
          </div>
          <div>
            <Label>Content</Label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>
          <Button type="submit" disabled={loading}>Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
