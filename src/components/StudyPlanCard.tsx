import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudyPlanCardProps {
  title: string;
  progress: number;
  dueDate: string;
  tasksCompleted: number;
  totalTasks: number;
}

export const StudyPlanCard = ({
  title,
  progress,
  dueDate,
  tasksCompleted,
  totalTasks,
}: StudyPlanCardProps) => {
  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-border/50 cursor-pointer group">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors">
              {title}
            </h4>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{dueDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>
                  {tasksCompleted}/{totalTasks} tasks
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Button variant="outline" size="sm" className="w-full">
          Continue Studying
        </Button>
      </div>
    </Card>
  );
};
