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

    const { goalId } = await req.json();

    // Get study goal details
    const { data: goal } = await supabaseClient
      .from("study_goals")
      .select("*")
      .eq("id", goalId)
      .single();

    if (!goal) throw new Error("Study goal not found");

    // Get current schedule
    const { data: scheduleItems } = await supabaseClient
      .from("study_schedule")
      .select("*")
      .eq("goal_id", goalId)
      .order("scheduled_date");

    if (!scheduleItems) throw new Error("No schedule found");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find skipped items (past dates, not completed, not skipped)
    const skippedItems = scheduleItems.filter(item => {
      const itemDate = new Date(item.scheduled_date);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate < today && !item.completed && !item.skipped;
    });

    if (skippedItems.length === 0) {
      console.log("No skipped items found");
      return new Response(
        JSON.stringify({ message: "Schedule is up to date", adjusted: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${skippedItems.length} skipped items, redistributing...`);

    // Mark old items as skipped
    for (const item of skippedItems) {
      await supabaseClient
        .from("study_schedule")
        .update({ skipped: true })
        .eq("id", item.id);
    }

    // Calculate remaining days until target
    const targetDate = new Date(goal.target_date);
    const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Redistribute skipped topics across remaining days
    const topicsToRedistribute = skippedItems.map(item => ({
      topic: item.topic,
      duration: item.duration_minutes,
      isWeak: item.is_weak_topic
    }));

    const dailyHours = goal.available_hours_per_day || 2;
    const dailyMinutes = dailyHours * 60;

    let currentDate = new Date(today);
    let currentDayLoad = 0;
    const newSchedule = [];

    for (const topicData of topicsToRedistribute) {
      if (currentDayLoad + topicData.duration > dailyMinutes) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDayLoad = 0;
      }

      newSchedule.push({
        user_id: user.id,
        goal_id: goalId,
        topic: topicData.topic,
        scheduled_date: currentDate.toISOString().split('T')[0],
        duration_minutes: topicData.duration,
        is_weak_topic: topicData.isWeak,
        completed: false,
        skipped: false
      });

      currentDayLoad += topicData.duration;
    }

    // Insert redistributed schedule
    const { error: insertError } = await supabaseClient
      .from("study_schedule")
      .insert(newSchedule);

    if (insertError) throw insertError;

    console.log(`Successfully redistributed ${skippedItems.length} topics`);

    return new Response(
      JSON.stringify({ 
        message: `Adjusted schedule: ${skippedItems.length} topics redistributed`,
        adjusted: true,
        itemsAdjusted: skippedItems.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in adjust-schedule:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to adjust schedule" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
