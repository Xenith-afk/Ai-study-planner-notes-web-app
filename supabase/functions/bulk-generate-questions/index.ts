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

    const { noteIds, type, count = 5 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!noteIds || noteIds.length === 0) throw new Error("No notes selected");

    console.log(`Bulk generating ${type} for ${noteIds.length} notes...`);

    // Fetch all selected notes
    const { data: notes, error: fetchError } = await supabaseClient
      .from("notes")
      .select("*")
      .in("id", noteIds);

    if (fetchError || !notes) throw new Error("Failed to fetch notes");

    const results: {
      mcqs: number;
      flashcards: number;
      errors: string[];
    } = {
      mcqs: 0,
      flashcards: 0,
      errors: []
    };

    // Process each note
    for (const note of notes) {
      try {
        if (type === "mcqs" || type === "both") {
          const mcqResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                  content: "You are an expert exam question creator. Generate MCQs, True/False, and Fill-in-the-blank questions. Return as JSON array: [{ question, type, options, correctAnswer, explanation }]",
                },
                {
                  role: "user",
                  content: `Generate ${count} practice questions from: ${note.content}. Topic: ${note.title}`,
                },
              ],
            }),
          });

          if (mcqResponse.ok) {
            const mcqData = await mcqResponse.json();
            const questions = JSON.parse(mcqData.choices[0].message.content);

            for (const q of questions) {
              await supabaseClient.from("mcqs").insert({
                user_id: user.id,
                note_id: note.id,
                topic: note.title,
                question: q.question,
                question_type: q.type,
                options: q.options,
                correct_answer: q.correctAnswer,
                explanation: q.explanation,
              });
              results.mcqs++;
            }
          }
        }

        if (type === "flashcards" || type === "both") {
          const flashcardResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                  content: "You are a flashcard creator. Generate concise question-answer pairs. Return as JSON array: [{ question, answer }]",
                },
                {
                  role: "user",
                  content: `Generate ${count} flashcards from: ${note.content}. Topic: ${note.title}`,
                },
              ],
            }),
          });

          if (flashcardResponse.ok) {
            const flashcardData = await flashcardResponse.json();
            const flashcards = JSON.parse(flashcardData.choices[0].message.content);

            for (const fc of flashcards) {
              await supabaseClient.from("flashcards").insert({
                user_id: user.id,
                note_id: note.id,
                topic: note.title,
                question: fc.question,
                answer: fc.answer,
              });
              results.flashcards++;
            }
          }
        }
      } catch (error) {
        console.error(`Error processing note ${note.id}:`, error);
        results.errors.push(`Failed to process "${note.title}"`);
      }
    }

    console.log(`Bulk generation complete: ${results.mcqs} MCQs, ${results.flashcards} flashcards`);

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        message: `Generated ${results.mcqs} MCQs and ${results.flashcards} flashcards`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in bulk-generate-questions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate questions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
