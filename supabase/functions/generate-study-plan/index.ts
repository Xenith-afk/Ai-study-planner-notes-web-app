import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const inputSchema = z.object({
  targetExam: z.string().min(1, "Target exam is required").max(200, "Exam name too long"),
  targetDate: z.string().min(1, "Target date is required").max(50),
  availableHours: z.number().min(0.5).max(24).default(2),
  syllabus: z.string().min(1, "Syllabus is required").max(5000, "Syllabus too long (max 5000 chars)")
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawBody = await req.json();
    const validationResult = inputSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: validationResult.error.errors[0].message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { targetExam, targetDate, availableHours, syllabus } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating personalized study plan");

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
    const plan = data.choices[0].message.content;

    console.log("Study plan generated successfully");

    return new Response(
      JSON.stringify({ plan }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-study-plan:", error instanceof Error ? error.message : "Unknown error");
    const errorMessage = error instanceof Error ? error.message : "Failed to generate study plan";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
