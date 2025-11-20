import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Search, Download, Trash2, Edit2, Folder } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const NotesVault = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;

      setNotes(notes.filter((n) => n.id !== id));
      toast.success("Note deleted");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  const handleExport = (note: any) => {
    const content = `Title: ${note.title}\n\nSubject: ${note.subject}\n\n${note.content || note.ai_summary || ""}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Note exported!");
  };

  const subjects = Array.from(new Set(notes.map((n) => n.subject)));
  
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = !selectedSubject || note.subject === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Folder className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Notes Vault</h2>
            <p className="text-sm text-muted-foreground">All your notes in one place</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedSubject === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedSubject(null)}
          >
            All ({notes.length})
          </Badge>
          {subjects.map((subject) => (
            <Badge
              key={subject}
              variant={selectedSubject === subject ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedSubject(subject)}
            >
              {subject} ({notes.filter((n) => n.subject === subject).length})
            </Badge>
          ))}
        </div>
      </Card>

      {/* Notes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {searchQuery || selectedSubject
              ? "No notes match your search"
              : "No notes yet. Create your first note!"}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{note.title}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {note.subject}
                    </Badge>
                  </div>
                  <BookOpen className="w-5 h-5 text-muted-foreground shrink-0" />
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.ai_summary || note.content?.substring(0, 150) || "No content"}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
                  {note.tags && note.tags.length > 0 && (
                    <span className="truncate ml-2">{note.tags.slice(0, 2).join(", ")}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleExport(note)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
