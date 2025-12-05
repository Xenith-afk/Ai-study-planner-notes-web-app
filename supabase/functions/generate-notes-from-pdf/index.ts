import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const inputSchema = z.object({
  pdfUrl: z.string().max(500).optional(),
  topic: z.string().min(3, "Topic must be at least 3 characters").max(200, "Topic too long (max 200 chars)").trim()
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

    const { topic } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating notes for topic length:", topic.length);

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
            content: "You are an expert study assistant. Generate well-structured study notes in valid JSON format. Your response must be ONLY valid JSON, no markdown code blocks or extra text. Use this exact structure: { \"title\": \"string\", \"keyPoints\": [\"string\"], \"formulas\": [\"string\"], \"definitions\": [\"string\"], \"explanations\": [\"string\"] }",
          },
          {
            role: "user",
            content: `Generate comprehensive study notes for the topic: ${topic}. Include title, 5-7 key points, relevant formulas (if applicable), important definitions, and clear explanations. Return ONLY valid JSON, no markdown formatting.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a few moments." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in your workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("AI API error occurred");
    }

    const data = await response.json();
    let notesContent = data.choices[0].message.content;

    // Clean up markdown code blocks if present
    notesContent = notesContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Validate JSON
    let notesData;
    try {
      notesData = JSON.parse(notesContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON");
      
      return new Response(
        JSON.stringify({ 
          error: "AI returned invalid JSON. Please try again.",
          details: "The AI response could not be parsed correctly."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Notes generated and parsed successfully");

    return new Response(
      JSON.stringify({ notes: notesContent, parsed: notesData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-notes-from-pdf:", error instanceof Error ? error.message : "Unknown error");
    const errorMessage = error instanceof Error ? error.message : "Failed to generate notes";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: "An unexpected error occurred"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
