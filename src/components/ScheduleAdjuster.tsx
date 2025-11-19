import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

interface ScheduleAdjusterProps {
  goalId: string;
  onAdjusted: () => void;
}

export const ScheduleAdjuster = ({ goalId, onAdjusted }: ScheduleAdjusterProps) => {
  const [adjusting, setAdjusting] = useState(false);

  const handleAdjustSchedule = async () => {
    setAdjusting(true);
    try {
      const { data, error } = await supabase.functions.invoke("adjust-schedule", {
        body: { goalId }
      });

      if (error) throw error;

      if (data.adjusted) {
        toast.success(data.message);
        onAdjusted();
      } else {
        toast.info("Schedule is up to date");
      }
    } catch (error: any) {
      console.error("Error adjusting schedule:", error);
      toast.error(error.message || "Failed to adjust schedule");
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <Button
      onClick={handleAdjustSchedule}
      disabled={adjusting}
      variant="outline"
      className="gap-2"
    >
      <RefreshCw className={`w-4 h-4 ${adjusting ? 'animate-spin' : ''}`} />
      Auto-Adjust Schedule
    </Button>
  );
};
