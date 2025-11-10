import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Flame, Star } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  health_score: number;
  streak_days: number;
  total_meals_logged: number;
  profiles: {
    full_name: string | null;
  };
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"score" | "streak" | "meals">("score");

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const loadLeaderboard = async () => {
    try {
      const orderColumn =
        sortBy === "score"
          ? "health_score"
          : sortBy === "streak"
          ? "streak_days"
          : "total_meals_logged";

      const { data, error } = await supabase
        .from("leaderboard")
        .select("*, profiles(full_name)")
        .order(orderColumn, { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Trophy className="h-6 w-6 text-amber-600" />;
    return <span className="text-muted-foreground font-semibold">#{index + 1}</span>;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Leaderboard</h1>
          <p className="text-muted-foreground">
            See how you stack up against other health enthusiasts
          </p>
        </div>

        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="score">
              <Star className="h-4 w-4 mr-2" />
              Health Score
            </TabsTrigger>
            <TabsTrigger value="streak">
              <Flame className="h-4 w-4 mr-2" />
              Streak
            </TabsTrigger>
            <TabsTrigger value="meals">
              <TrendingUp className="h-4 w-4 mr-2" />
              Meals Logged
            </TabsTrigger>
          </TabsList>

          <TabsContent value={sortBy} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  Top {sortBy === "score" ? "Health Scores" : sortBy === "streak" ? "Streaks" : "Meal Loggers"}
                </CardTitle>
                <CardDescription>Updated in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No entries yet. Be the first!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                          index < 3 ? "bg-accent" : "hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex items-center justify-center w-12">
                          {getRankIcon(index)}
                        </div>

                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(entry.profiles?.full_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {entry.profiles?.full_name || "Anonymous User"}
                          </p>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            <span>Score: {entry.health_score}</span>
                            <span>Streak: {entry.streak_days}d</span>
                            <span>Meals: {entry.total_meals_logged}</span>
                          </div>
                        </div>

                        {sortBy === "score" && (
                          <Badge variant="secondary" className="ml-auto">
                            {entry.health_score} pts
                          </Badge>
                        )}
                        {sortBy === "streak" && (
                          <Badge variant="secondary" className="ml-auto">
                            {entry.streak_days} days
                          </Badge>
                        )}
                        {sortBy === "meals" && (
                          <Badge variant="secondary" className="ml-auto">
                            {entry.total_meals_logged} meals
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
