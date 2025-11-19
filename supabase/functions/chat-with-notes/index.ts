import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { message, conversationHistory = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Fetching user's notes for context...");

    // Fetch user's notes to provide context
    const { data: notes } = await supabaseClient
      .from("notes")
      .select("title, content, subject, ai_summary")
      .eq("user_id", user.id)
      .limit(20);

    // Build context from notes
    const notesContext = notes?.map(note => 
      `Subject: ${note.subject}\nTitle: ${note.title}\nSummary: ${note.ai_summary || ''}\nContent: ${note.content?.substring(0, 500) || ''}`
    ).join("\n\n") || "No notes available.";

    console.log("Generating AI response with notes context...");

    const messages = [
      {
        role: "system",
        content: `You are a helpful AI study buddy. You have access to the student's notes and can answer questions based on them. Here are the student's notes:\n\n${notesContext}\n\nProvide clear, concise explanations. Reference specific notes when relevant. If asked about something not in the notes, provide general educational help.`
      },
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
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

    console.log("Streaming AI response to client...");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in chat-with-notes:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to process chat" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
