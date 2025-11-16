import { Card } from "@/components/ui/card";
import { BookOpen, Target, TrendingUp, Clock } from "lucide-react";

export const StatsOverview = () => {
  const stats = [
    {
      icon: BookOpen,
      label: "Total Notes",
      value: "24",
      change: "+3 this week",
      color: "text-primary",
    },
    {
      icon: Target,
      label: "Active Goals",
      value: "5",
      change: "2 completed",
      color: "text-accent",
    },
    {
      icon: TrendingUp,
      label: "Study Streak",
      value: "12 days",
      change: "Keep it up!",
      color: "text-success",
    },
    {
      icon: Clock,
      label: "Study Time",
      value: "8.5h",
      change: "This week",
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
