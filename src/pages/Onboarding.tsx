import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Target, ArrowRight } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [classCourse, setClassCourse] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!classCourse.trim() || !targetExam.trim()) {
      toast.error("Please fill in both fields");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        class_course: classCourse,
        target_exam: targetExam,
        onboarding_completed: true,
      });

      if (error) throw error;

      toast.success("Profile setup complete! 🎉");
      navigate("/");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome to StudyFlow AI
          </h1>
          <p className="text-muted-foreground">
            Let's personalize your learning experience
          </p>
        </div>

        <div className="space-y-6">
          {step === 1 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <BookOpen className="w-5 h-5" />
                <span className="text-sm font-medium">Step 1 of 2</span>
              </div>
              <div>
                <Label htmlFor="class">What's your class or course?</Label>
                <Input
                  id="class"
                  placeholder="e.g., Grade 10, BTech CS, MBBS 1st Year"
                  value={classCourse}
                  onChange={(e) => setClassCourse(e.target.value)}
                  className="mt-2"
                  autoFocus
                />
              </div>
              <Button 
                onClick={() => setStep(2)} 
                className="w-full gap-2"
                disabled={!classCourse.trim()}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Target className="w-5 h-5" />
                <span className="text-sm font-medium">Step 2 of 2</span>
              </div>
              <div>
                <Label htmlFor="exam">What's your target exam or goal?</Label>
                <Input
                  id="exam"
                  placeholder="e.g., NEET, JEE, SAT, Semester Finals"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="mt-2"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleComplete} 
                  className="flex-1 gap-2"
                  disabled={!targetExam.trim() || loading}
                >
                  {loading ? "Setting up..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;
