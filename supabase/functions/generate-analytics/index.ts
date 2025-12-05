import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Note: This function doesn't take user input, it fetches data from the database
// Authentication is the primary validation

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch user's progress data
    const { data: progressData } = await supabaseClient
      .from("progress_tracker")
      .select("*")
      .eq("user_id", user.id);

    // Fetch study schedule data
    const { data: scheduleData } = await supabaseClient
      .from("study_schedule")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_date", { ascending: false })
      .limit(30);

    const completedCount = progressData?.filter(p => p.completed).length || 0;
    const totalCount = progressData?.length || 0;
    const weakTopics = progressData?.filter(p => p.is_weak).map(p => p.topic) || [];
    const completedSchedule = scheduleData?.filter(s => s.completed).length || 0;
    const skippedSchedule = scheduleData?.filter(s => s.skipped).length || 0;

    console.log("Generating analytics insights...");

    // Sanitize data before sending to AI (only send counts, not actual topic names if sensitive)
    const weakTopicsList = weakTopics.slice(0, 10).join(', ') || 'none';

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a study analytics expert. Analyze study data and provide actionable insights in JSON format: { insights: [string array], improvements: [string array], strengths: [string array], weeklyGoal: string }",
          },
          {
            role: "user",
            content: `Analyze this study data: ${completedCount}/${totalCount} topics completed, ${weakTopics.length} weak topics (${weakTopicsList}), ${completedSchedule} scheduled items completed, ${skippedSchedule} items skipped. Provide insights and improvement suggestions.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("AI API error occurred");
    }

    const data = await response.json();
    const analyticsData = JSON.parse(data.choices[0].message.content);

    console.log("Analytics insights generated successfully");

    return new Response(
      JSON.stringify({ 
        analytics: analyticsData,
        stats: {
          completedCount,
          totalCount,
          weakTopicsCount: weakTopics.length,
          completedSchedule,
          skippedSchedule
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-analytics:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate analytics" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
