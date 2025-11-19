import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const BulkOperations = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [operationType, setOperationType] = useState<"mcqs" | "flashcards" | "both">("both");

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setNotes(data || []);
  };

  const toggleNote = (noteId: string) => {
    setSelectedNotes(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const handleBulkGenerate = async () => {
    if (selectedNotes.length === 0) {
      toast.error("Please select at least one note");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("bulk-generate-questions", {
        body: {
          noteIds: selectedNotes,
          type: operationType,
          count: 5
        }
      });

      if (error) throw error;

      toast.success(data.message);
      setSelectedNotes([]);
    } catch (error: any) {
      console.error("Error in bulk generation:", error);
      toast.error(error.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Bulk Operations</h2>
        <p className="text-muted-foreground">Generate MCQs and flashcards from multiple notes at once</p>
      </div>

      <Card className="p-6">
        <div className="space-y-4 mb-6">
          <Label>What would you like to generate?</Label>
          <RadioGroup value={operationType} onValueChange={(v: any) => setOperationType(v)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mcqs" id="mcqs" />
              <Label htmlFor="mcqs">MCQs Only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="flashcards" id="flashcards" />
              <Label htmlFor="flashcards">Flashcards Only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="both" />
              <Label htmlFor="both">Both MCQs & Flashcards</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No notes available</p>
          ) : (
            notes.map(note => (
              <div key={note.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={selectedNotes.includes(note.id)}
                  onCheckedChange={() => toggleNote(note.id)}
                  id={note.id}
                />
                <div className="flex-1">
                  <Label htmlFor={note.id} className="font-medium cursor-pointer">
                    {note.title}
                  </Label>
                  <p className="text-sm text-muted-foreground">{note.subject}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedNotes.length} note{selectedNotes.length !== 1 ? 's' : ''} selected
          </p>
          <Button
            onClick={handleBulkGenerate}
            disabled={loading || selectedNotes.length === 0}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Generate Questions
          </Button>
        </div>
      </Card>
    </div>
  );
};
