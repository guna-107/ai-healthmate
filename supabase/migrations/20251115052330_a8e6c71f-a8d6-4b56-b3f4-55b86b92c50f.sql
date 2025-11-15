-- Update check_achievements function to use valid achievement types
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

  -- First meal achievement
  IF meal_count >= 1 THEN
    INSERT INTO achievements (user_id, achievement_name, achievement_type, description, icon, achieved_at)
    VALUES (user_uuid, 'First Steps', 'calories', 'Logged your first meal!', '🎯', now())
    ON CONFLICT (user_id, achievement_name) DO NOTHING;
  END IF;

  -- 7-day streak achievement
  IF current_streak >= 7 THEN
    INSERT INTO achievements (user_id, achievement_name, achievement_type, description, icon, achieved_at)
    VALUES (user_uuid, 'Week Warrior', 'streak', 'Maintained a 7-day logging streak!', '🔥', now())
    ON CONFLICT (user_id, achievement_name) DO NOTHING;
  END IF;

  -- 30-day streak achievement
  IF current_streak >= 30 THEN
    INSERT INTO achievements (user_id, achievement_name, achievement_type, description, icon, achieved_at)
    VALUES (user_uuid, 'Consistency King', 'streak', 'Incredible 30-day streak!', '👑', now())
    ON CONFLICT (user_id, achievement_name) DO NOTHING;
  END IF;

  -- 50 meals achievement
  IF meal_count >= 50 THEN
    INSERT INTO achievements (user_id, achievement_name, achievement_type, description, icon, achieved_at)
    VALUES (user_uuid, 'Meal Master', 'calories', 'Logged 50 meals!', '🍽️', now())
    ON CONFLICT (user_id, achievement_name) DO NOTHING;
  END IF;
END;
$$;