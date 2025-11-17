import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetExam, targetDate, availableHours, syllabus } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating personalized study plan...");

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
            content: "You are an expert study planner. Create a personalized day-by-day study schedule with topics, duration, and priorities. Format as JSON: { schedule: [{ date, topic, durationMinutes, priority: 'high'|'medium'|'low' }], weeklyGoals: [] }",
          },
          {
            role: "user",
            content: `Create a study plan for: ${targetExam}. Target date: ${targetDate}. Available hours per day: ${availableHours}. Syllabus: ${syllabus}. Distribute topics efficiently and prioritize weak areas.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI API error:", response.status, error);
      
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

      throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    const plan = data.choices[0].message.content;

    console.log("Study plan generated successfully");

    return new Response(
      JSON.stringify({ plan }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-study-plan:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate study plan";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
