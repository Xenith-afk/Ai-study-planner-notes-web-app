import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  FileQuestion, 
  Calendar, 
  Target, 
  Gauge,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface FeatureRateLimit {
  name: string;
  icon: React.ElementType;
  maxRequests: number;
  windowMinutes: number;
  used: number;
  color: string;
}

interface RateLimitDashboardProps {
  tutorUsage: number;
  examUsage: number;
  reviewUsage: number;
  adaptiveUsage: number;
}

export const RateLimitDashboard = ({
  tutorUsage,
  examUsage,
  reviewUsage,
  adaptiveUsage,
}: RateLimitDashboardProps) => {
  const features: FeatureRateLimit[] = [
    {
      name: "AI Tutor",
      icon: GraduationCap,
      maxRequests: 15,
      windowMinutes: 1,
      used: tutorUsage,
      color: "text-blue-500",
    },
    {
      name: "Mock Exam",
      icon: FileQuestion,
      maxRequests: 5,
      windowMinutes: 5,
      used: examUsage,
      color: "text-purple-500",
    },
    {
      name: "Spaced Review",
      icon: Calendar,
      maxRequests: 10,
      windowMinutes: 5,
      used: reviewUsage,
      color: "text-amber-500",
    },
    {
      name: "Adaptive AI",
      icon: Target,
      maxRequests: 10,
      windowMinutes: 5,
      used: adaptiveUsage,
      color: "text-green-500",
    },
  ];

  const getUsagePercentage = (used: number, max: number) => 
    Math.min((used / max) * 100, 100);

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 80) return "bg-amber-500";
    return "bg-primary";
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Limited
        </Badge>
      );
    }
    if (percentage >= 80) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-amber-500/20 text-amber-600">
          <AlertCircle className="w-3 h-3" />
          Warning
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1 bg-green-500/20 text-green-600">
        <CheckCircle2 className="w-3 h-3" />
        Available
      </Badge>
    );
  };

  const totalUsed = features.reduce((sum, f) => sum + f.used, 0);
  const totalMax = features.reduce((sum, f) => sum + f.maxRequests, 0);
  const overallPercentage = getUsagePercentage(totalUsed, totalMax);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gauge className="w-5 h-5 text-primary" />
          Rate Limit Dashboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Monitor AI feature usage across all components
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall usage */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Usage</span>
            <span className="text-muted-foreground">
              {totalUsed} / {totalMax} requests
            </span>
          </div>
          <Progress 
            value={overallPercentage} 
            className="h-2"
          />
        </div>

        {/* Individual features */}
        <div className="grid gap-3">
          {features.map((feature) => {
            const percentage = getUsagePercentage(feature.used, feature.maxRequests);
            const Icon = feature.icon;
            
            return (
              <div 
                key={feature.name}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
              >
                <div className={`p-2 rounded-lg bg-background ${feature.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{feature.name}</span>
                    {getStatusBadge(percentage)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={percentage} 
                      className={`h-1.5 flex-1 [&>div]:${getStatusColor(percentage)}`}
                    />
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {feature.used}/{feature.maxRequests}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Resets every {feature.windowMinutes} min
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Available
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Warning (80%+)
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            Limited
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
