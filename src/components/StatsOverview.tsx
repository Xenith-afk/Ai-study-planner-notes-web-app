import { Card } from "@/components/ui/card";
import { BookOpen, Target, TrendingUp, Clock } from "lucide-react";

interface StatsOverviewProps {
  totalNotes: number;
  totalPlans: number;
  completedTasks: number;
  totalTasks: number;
}

export const StatsOverview = ({ totalNotes, totalPlans, completedTasks, totalTasks }: StatsOverviewProps) => {
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      icon: BookOpen,
      label: "Total Notes",
      value: totalNotes.toString(),
      change: "Study materials",
      color: "text-primary",
    },
    {
      icon: Target,
      label: "Study Plans",
      value: totalPlans.toString(),
      change: "Active plans",
      color: "text-accent",
    },
    {
      icon: TrendingUp,
      label: "Completion",
      value: `${completionRate}%`,
      change: `${completedTasks}/${totalTasks} tasks`,
      color: "text-success",
    },
    {
      icon: Clock,
      label: "Total Tasks",
      value: totalTasks.toString(),
      change: `${totalTasks - completedTasks} remaining`,
      color: "text-warning",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={index} 
          className="p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-border/50"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-${stat.color.replace('text-', '')}/20 to-${stat.color.replace('text-', '')}/10 flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
