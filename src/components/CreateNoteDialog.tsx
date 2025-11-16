import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateNoteDialog = ({ open, onOpenChange }: CreateNoteDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const { toast } = useToast();

  const handleCreate = () => {
    if (!title || !content || !subject) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Note created!",
      description: "Your note has been saved successfully",
    });
    
    // Reset form
    setTitle("");
    setContent("");
    setSubject("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Add a new note to your study collection. AI features coming soon!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="computer-science">Computer Science</SelectItem>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
                <SelectItem value="biology">Biology</SelectItem>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="literature">Literature</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
            />
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">AI Features Coming Soon</p>
                <p className="text-xs text-muted-foreground">
                  Auto-summarize, generate study questions, and more with AI assistance.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} className="bg-gradient-to-r from-primary to-accent">
            Create Note
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
