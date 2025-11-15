import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure profile exists (create if it doesn't)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      console.log('Creating profile for user:', user.id);
      await supabase.from('profiles').insert({ id: user.id });
    }

    // Calculate health score using database function
    const { data: scoreData, error: scoreError } = await supabase
      .rpc('calculate_health_score', { user_uuid: user.id });

    if (scoreError) throw scoreError;

    // Check if health metrics exist
    const { data: existingMetrics } = await supabase
      .from('health_metrics')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    // Update or insert health metrics with calculated score
    if (existingMetrics) {
      const { error: updateError } = await supabase
        .from('health_metrics')
        .update({
          score: scoreData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating health metrics:', updateError);
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('health_metrics')
        .insert({
          user_id: user.id,
          score: scoreData,
        });

      if (insertError) {
        console.error('Error inserting health metrics:', insertError);
        throw insertError;
      }
    }

    // Update streak
    const { error: streakError } = await supabase
      .rpc('update_user_streak', { user_uuid: user.id });

    if (streakError) {
      console.error('Error updating streak:', streakError);
      throw streakError;
    }

    // Check and award achievements
    const { error: achievementError } = await supabase
      .rpc('check_achievements', { user_uuid: user.id });

    if (achievementError) {
      console.error('Error checking achievements:', achievementError);
      throw achievementError;
    }

    // Get updated health metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (metricsError) throw metricsError;

    return new Response(
      JSON.stringify({ 
        score: scoreData,
        streak: metrics?.streak_days || 0,
        lastLogDate: metrics?.last_log_date
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error calculating health score:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
