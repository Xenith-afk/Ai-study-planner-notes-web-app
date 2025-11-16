import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoteCardProps {
  title: string;
  excerpt: string;
  subject: string;
  date: string;
}

export const NoteCard = ({ title, excerpt, subject, date }: NoteCardProps) => {
  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-border/50 cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {excerpt}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {subject}
        </Badge>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
    </Card>
  );
};
