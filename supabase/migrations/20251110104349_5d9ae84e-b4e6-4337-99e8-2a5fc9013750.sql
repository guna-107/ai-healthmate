-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan text CHECK (plan IN ('free', 'pro', 'premium')) NOT NULL DEFAULT 'free',
  status text CHECK (status IN ('active', 'canceled', 'trial', 'past_due')) NOT NULL DEFAULT 'active',
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create leaderboard table
CREATE TABLE public.leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  health_score integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  total_meals_logged integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is viewable by everyone"
  ON public.leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own leaderboard entry"
  ON public.leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard entry"
  ON public.leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

-- Create posts table for social feed
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  image_url text,
  likes_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- Create comments table
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create likes table
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION public.update_leaderboard(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_health_score integer;
  user_streak integer;
  user_meals_count integer;
BEGIN
  SELECT COALESCE(score, 0) INTO user_health_score
  FROM health_metrics
  WHERE user_id = user_uuid;

  SELECT COALESCE(streak_days, 0) INTO user_streak
  FROM health_metrics
  WHERE user_id = user_uuid;

  SELECT COUNT(*) INTO user_meals_count
  FROM meals
  WHERE user_id = user_uuid;

  INSERT INTO leaderboard (user_id, health_score, streak_days, total_meals_logged, last_updated)
  VALUES (user_uuid, user_health_score, user_streak, user_meals_count, now())
  ON CONFLICT (user_id) DO UPDATE SET
    health_score = user_health_score,
    streak_days = user_streak,
    total_meals_logged = user_meals_count,
    last_updated = now();
END;
$$;

-- Function to increment post likes
CREATE OR REPLACE FUNCTION public.increment_post_likes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

-- Function to decrement post likes
CREATE OR REPLACE FUNCTION public.decrement_post_likes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count - 1
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

-- Triggers for post likes
CREATE TRIGGER on_like_added
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_post_likes();

CREATE TRIGGER on_like_removed
  AFTER DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_post_likes();