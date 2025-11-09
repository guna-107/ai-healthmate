-- Create health_metrics table for scoring and streaks
CREATE TABLE IF NOT EXISTS public.health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  last_log_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health metrics"
  ON public.health_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health metrics"
  ON public.health_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health metrics"
  ON public.health_metrics FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_health_metrics_updated_at
  BEFORE UPDATE ON public.health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add columns to achievements table if not exists
ALTER TABLE public.achievements 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS icon text DEFAULT '🏆';

-- Function to calculate and update health score
CREATE OR REPLACE FUNCTION public.calculate_health_score(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score integer := 0;
  today_log RECORD;
  user_profile RECORD;
BEGIN
  SELECT * INTO today_log
  FROM daily_logs
  WHERE user_id = user_uuid AND log_date = CURRENT_DATE;

  SELECT * INTO user_profile
  FROM profiles
  WHERE id = user_uuid;

  IF today_log IS NOT NULL AND user_profile IS NOT NULL THEN
    IF today_log.total_calories >= user_profile.daily_calorie_goal * 0.9 
       AND today_log.total_calories <= user_profile.daily_calorie_goal * 1.1 THEN
      score := score + 25;
    ELSIF today_log.total_calories >= user_profile.daily_calorie_goal * 0.7 THEN
      score := score + 15;
    END IF;

    IF today_log.total_protein_g >= user_profile.daily_protein_goal * 0.9 THEN
      score := score + 25;
    ELSIF today_log.total_protein_g >= user_profile.daily_protein_goal * 0.7 THEN
      score := score + 15;
    END IF;

    IF today_log.water_glasses >= 8 THEN
      score := score + 25;
    ELSIF today_log.water_glasses >= 6 THEN
      score := score + 15;
    END IF;

    IF today_log.steps >= 10000 THEN
      score := score + 25;
    ELSIF today_log.steps >= 7000 THEN
      score := score + 15;
    END IF;
  END IF;

  RETURN score;
END;
$$;

-- Function to update streak
CREATE OR REPLACE FUNCTION public.update_user_streak(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_metrics RECORD;
  yesterday date;
BEGIN
  yesterday := CURRENT_DATE - INTERVAL '1 day';
  
  SELECT * INTO current_metrics
  FROM health_metrics
  WHERE user_id = user_uuid;

  IF current_metrics IS NULL THEN
    INSERT INTO health_metrics (user_id, streak_days, last_log_date)
    VALUES (user_uuid, 1, CURRENT_DATE);
  ELSE
    IF current_metrics.last_log_date = CURRENT_DATE THEN
      RETURN;
    ELSIF current_metrics.last_log_date = yesterday THEN
      UPDATE health_metrics
      SET streak_days = streak_days + 1,
          last_log_date = CURRENT_DATE,
          updated_at = now()
      WHERE user_id = user_uuid;
    ELSE
      UPDATE health_metrics
      SET streak_days = 1,
          last_log_date = CURRENT_DATE,
          updated_at = now()
      WHERE user_id = user_uuid;
    END IF;
  END IF;
END;
$$;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_achievements(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meal_count integer;
  current_streak integer;
BEGIN
  SELECT COUNT(*) INTO meal_count
  FROM meals
  WHERE user_id = user_uuid;

  SELECT COALESCE(streak_days, 0) INTO current_streak
  FROM health_metrics
  WHERE user_id = user_uuid;

  IF meal_count >= 1 THEN
    INSERT INTO achievements (user_id, achievement_name, achievement_type, description, icon, achieved_at)
    VALUES (user_uuid, 'First Steps', 'milestone', 'Logged your first meal!', '🎯', now())
    ON CONFLICT (user_id, achievement_name) DO NOTHING;
  END IF;

  IF current_streak >= 7 THEN
    INSERT INTO achievements (user_id, achievement_name, achievement_type, description, icon, achieved_at)
    VALUES (user_uuid, 'Week Warrior', 'milestone', 'Maintained a 7-day logging streak!', '🔥', now())
    ON CONFLICT (user_id, achievement_name) DO NOTHING;
  END IF;

  IF current_streak >= 30 THEN
    INSERT INTO achievements (user_id, achievement_name, achievement_type, description, icon, achieved_at)
    VALUES (user_uuid, 'Consistency King', 'milestone', 'Incredible 30-day streak!', '👑', now())
    ON CONFLICT (user_id, achievement_name) DO NOTHING;
  END IF;

  IF meal_count >= 50 THEN
    INSERT INTO achievements (user_id, achievement_name, achievement_type, description, icon, achieved_at)
    VALUES (user_uuid, 'Meal Master', 'milestone', 'Logged 50 meals!', '🍽️', now())
    ON CONFLICT (user_id, achievement_name) DO NOTHING;
  END IF;
END;
$$;

-- Add unique constraint to prevent duplicate achievements
CREATE UNIQUE INDEX IF NOT EXISTS achievements_user_name_unique 
ON public.achievements(user_id, achievement_name);