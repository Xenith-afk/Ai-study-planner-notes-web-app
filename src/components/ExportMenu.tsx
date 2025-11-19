import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Calendar, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ExportMenu = () => {
  const exportNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: notes } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id);

      if (!notes || notes.length === 0) {
        toast.error("No notes to export");
        return;
      }

      // Create simple text format
      let content = "# My Study Notes\n\n";
      notes.forEach(note => {
        content += `## ${note.title}\n`;
        content += `**Subject:** ${note.subject}\n`;
        content += `**Date:** ${new Date(note.created_at).toLocaleDateString()}\n\n`;
        content += `${note.content || ''}\n\n`;
        if (note.ai_summary) {
          content += `**AI Summary:** ${note.ai_summary}\n\n`;
        }
        content += "---\n\n";
      });

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `study-notes-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Notes exported successfully");
    } catch (error) {
      console.error("Error exporting notes:", error);
      toast.error("Failed to export notes");
    }
  };

  const exportStudyPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: schedule } = await supabase
        .from("study_schedule")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_date");

      if (!schedule || schedule.length === 0) {
        toast.error("No study schedule to export");
        return;
      }

      // Create iCal format
      let ical = "BEGIN:VCALENDAR\n";
      ical += "VERSION:2.0\n";
      ical += "PRODID:-//Study Planner//EN\n";
      ical += "CALSCALE:GREGORIAN\n";

      schedule.forEach((item: any) => {
        const date = new Date(item.scheduled_date);
        const dateStr = date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        
        ical += "BEGIN:VEVENT\n";
        ical += `UID:${item.id}@studyplanner\n`;
        ical += `DTSTAMP:${dateStr}\n`;
        ical += `DTSTART:${dateStr}\n`;
        ical += `SUMMARY:Study: ${item.topic}\n`;
        ical += `DESCRIPTION:Duration: ${item.duration_minutes} minutes\n`;
        ical += "END:VEVENT\n";
      });

      ical += "END:VCALENDAR\n";

      const blob = new Blob([ical], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `study-plan-${new Date().toISOString().split('T')[0]}.ics`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Study plan exported as calendar file");
    } catch (error) {
      console.error("Error exporting study plan:", error);
      toast.error("Failed to export study plan");
    }
  };

  const exportProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: progress } = await supabase
        .from("progress_tracker")
        .select("*")
        .eq("user_id", user.id);

      if (!progress || progress.length === 0) {
        toast.error("No progress data to export");
        return;
      }

      const completedCount = progress.filter(p => p.completed).length;
      const weakCount = progress.filter(p => p.is_weak).length;
      const completionRate = Math.round((completedCount / progress.length) * 100);

      let content = "# Study Progress Report\n\n";
      content += `**Generated:** ${new Date().toLocaleString()}\n\n`;
      content += `## Overview\n`;
      content += `- Total Topics: ${progress.length}\n`;
      content += `- Completed: ${completedCount} (${completionRate}%)\n`;
      content += `- Weak Topics: ${weakCount}\n\n`;
      content += `## Topic Details\n\n`;

      progress.forEach(item => {
        content += `### ${item.topic}\n`;
        content += `- Subject: ${item.subject || 'N/A'}\n`;
        content += `- Status: ${item.completed ? '✓ Completed' : '○ In Progress'}\n`;
        if (item.is_weak) content += `- ⚠️ Marked as Weak Topic\n`;
        if (item.confidence_level) content += `- Confidence: ${item.confidence_level}/10\n`;
        if (item.last_reviewed) content += `- Last Reviewed: ${new Date(item.last_reviewed).toLocaleDateString()}\n`;
        content += "\n";
      });

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `progress-report-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Progress report exported");
    } catch (error) {
      console.error("Error exporting progress:", error);
      toast.error("Failed to export progress report");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportNotes} className="gap-2">
          <FileText className="w-4 h-4" />
          Export Notes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportStudyPlan} className="gap-2">
          <Calendar className="w-4 h-4" />
          Export Study Plan
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportProgress} className="gap-2">
          <BarChart3 className="w-4 h-4" />
          Export Progress Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
