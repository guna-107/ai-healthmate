import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, ArrowLeft, Trophy, Target, Flame } from "lucide-react";
import { toast } from "sonner";

interface Achievement {
  id: string;
  achievement_name: string;
  achievement_type: string;
  description: string;
  icon: string;
  achieved_at: string | null;
  created_at: string;
}

const Achievements = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    if (user) {
      loadAchievements();
      loadStreak();
    }
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const loadStreak = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('streak_days')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setStreakDays(data?.streak_days || 0);
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const earnedAchievements = achievements.filter(a => a.achieved_at);
  const lockedAchievements = achievements.filter(a => !a.achieved_at);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Activity className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">Achievements</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Streak Card */}
        <Card className="mb-8 gradient-primary text-primary-foreground shadow-health-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Flame className="w-6 h-6" />
                  Current Streak
                </CardTitle>
                <CardDescription className="text-primary-foreground/80 mt-2">
                  Keep logging daily to maintain your streak!
                </CardDescription>
              </div>
              <div className="text-6xl font-bold">{streakDays}</div>
            </div>
          </CardHeader>
        </Card>

        {/* Earned Achievements */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Earned Achievements</h2>
            <Badge variant="secondary">{earnedAchievements.length}</Badge>
          </div>

          {earnedAchievements.length === 0 ? (
            <Card className="shadow-health-sm">
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No achievements yet. Start logging meals to earn your first achievement!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedAchievements.map((achievement) => (
                <Card key={achievement.id} className="shadow-health-sm hover:shadow-health-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-4xl">{achievement.icon}</div>
                      <Badge className="bg-primary text-primary-foreground">Earned</Badge>
                    </div>
                    <CardTitle className="mt-4">{achievement.achievement_name}</CardTitle>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Earned {new Date(achievement.achieved_at!).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-muted-foreground" />
              <h2 className="text-2xl font-bold">Locked Achievements</h2>
              <Badge variant="outline">{lockedAchievements.length}</Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedAchievements.map((achievement) => (
                <Card key={achievement.id} className="shadow-health-sm opacity-60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-4xl grayscale">{achievement.icon}</div>
                      <Badge variant="outline">Locked</Badge>
                    </div>
                    <CardTitle className="mt-4">{achievement.achievement_name}</CardTitle>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Achievements;
