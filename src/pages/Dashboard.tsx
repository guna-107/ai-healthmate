import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Camera,
  MessageSquare,
  TrendingUp,
  Flame,
  Apple,
  Droplet,
  Zap,
  Target,
  Award,
  LogOut
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const [dailyStats, setDailyStats] = useState({
    calories: { current: 0, target: 2000, unit: "kcal" },
    protein: { current: 0, target: 120, unit: "g" },
    water: { current: 0, target: 8, unit: "glasses" },
    steps: { current: 0, target: 10000, unit: "steps" },
  });

  const [userName, setUserName] = useState("there");
  const [healthScore, setHealthScore] = useState(0);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const [profileResponse, dailyLogResponse] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("daily_logs").select("*").eq("user_id", user.id).eq("log_date", today).maybeSingle(),
      ]);

      if (profileResponse.data) {
        const profile = profileResponse.data;
        setUserName(profile.full_name?.split(' ')[0] || "there");
        setDailyStats(prev => ({
          ...prev,
          calories: { ...prev.calories, target: profile.daily_calorie_goal || 2000 },
          protein: { ...prev.protein, target: profile.daily_protein_goal || 120 },
        }));
      }

      if (dailyLogResponse.data) {
        const log = dailyLogResponse.data;
        setDailyStats(prev => ({
          calories: { current: log.total_calories || 0, target: prev.calories.target, unit: "kcal" },
          protein: { current: log.total_protein_g || 0, target: prev.protein.target, unit: "g" },
          water: { current: log.water_glasses || 0, target: 8, unit: "glasses" },
          steps: { current: log.steps || 0, target: 10000, unit: "steps" },
        }));
      }

      loadRecommendations();
      calculateHealthScore();
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthScore = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('calculate-health-score');
      
      if (error) throw error;
      if (data) {
        setHealthScore(data.score || 0);
        setStreakDays(data.streak || 0);
      }
    } catch (error) {
      console.error("Error calculating health score:", error);
    }
  };

  const loadRecommendations = async () => {
    setRecommendationsLoading(true);
    try {
      const RECOMMENDATIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-recommendations`;

      const response = await fetch(RECOMMENDATIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: {
            calories: dailyStats.calories.current,
            calorieTarget: dailyStats.calories.target,
            protein: dailyStats.protein.current,
            proteinTarget: dailyStats.protein.target,
            water: dailyStats.water.current,
            waterTarget: dailyStats.water.target,
            steps: dailyStats.steps.current,
            stepsTarget: dailyStats.steps.target,
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch recommendations');

      const data = await response.json();
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations.slice(0, 3));
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const aiTips = [
    dailyStats.water.current < dailyStats.water.target
      ? `Great job staying hydrated! Try to drink ${dailyStats.water.target - dailyStats.water.current} more glasses of water today.`
      : "Excellent hydration today!",
    dailyStats.calories.current < dailyStats.calories.target * 0.8
      ? `You're ${dailyStats.calories.target - dailyStats.calories.current} calories under your target. Consider a healthy snack like nuts or fruit.`
      : "Your calorie intake is on track!",
    dailyStats.protein.current >= dailyStats.protein.target * 0.9
      ? "Your protein intake is excellent! Keep up the good work with lean proteins."
      : `Try to add ${Math.round(dailyStats.protein.target - dailyStats.protein.current)}g more protein to reach your goal.`,
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">AI Health Mentor</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/achievements")}>
              <Award className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <Target className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">Here's your health summary for today</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="gradient-card border-border/50 shadow-health-sm hover:shadow-health-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Calories</CardTitle>
                <Flame className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {dailyStats.calories.current}/{dailyStats.calories.target}
              </div>
              <Progress value={(dailyStats.calories.current / dailyStats.calories.target) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {dailyStats.calories.target - dailyStats.calories.current} kcal remaining
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 shadow-health-sm hover:shadow-health-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Protein</CardTitle>
                <Apple className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {dailyStats.protein.current}/{dailyStats.protein.target}g
              </div>
              <Progress value={(dailyStats.protein.current / dailyStats.protein.target) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {dailyStats.protein.target - dailyStats.protein.current}g to goal
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 shadow-health-sm hover:shadow-health-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Hydration</CardTitle>
                <Droplet className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {dailyStats.water.current}/{dailyStats.water.target}
              </div>
              <Progress value={(dailyStats.water.current / dailyStats.water.target) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {dailyStats.water.target - dailyStats.water.current} glasses left
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50 shadow-health-sm hover:shadow-health-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Activity</CardTitle>
                <Zap className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {dailyStats.steps.current.toLocaleString()}
              </div>
              <Progress value={(dailyStats.steps.current / dailyStats.steps.target) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {(dailyStats.steps.target - dailyStats.steps.current).toLocaleString()} steps to goal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* AI Insights */}
          <Card className="lg:col-span-2 shadow-health-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                AI Health Insights
              </CardTitle>
              <CardDescription>Personalized tips based on your progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.length > 0 ? (
                recommendations.map((tip, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <p className="text-sm">{tip}</p>
                  </div>
                ))
              ) : (
                aiTips.map((tip, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <p className="text-sm">{tip}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-health-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Log your activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/upload")}
              >
                <Camera className="w-4 h-4 mr-2" />
                Log Meal
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/chat")}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Ask AI Coach
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/progress")}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Progress
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/achievements")}
              >
                <Award className="w-4 h-4 mr-2" />
                Achievements
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Health Score */}
        <Card className="mt-6 gradient-primary text-primary-foreground shadow-health-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Today's Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold">{healthScore}</div>
              <div className="flex-1">
                <p className="text-sm opacity-90 mb-2">
                  {healthScore >= 80 ? "Great job! You're on track with your goals." :
                   healthScore >= 50 ? "Good progress! Keep it up." :
                   "Let's work together to improve your health score!"}
                </p>
                <Progress value={healthScore} className="h-2 bg-primary-foreground/20" />
              </div>
            </div>
            {streakDays > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm opacity-90">
                <Flame className="w-4 h-4" />
                <span>{streakDays} day streak!</span>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
