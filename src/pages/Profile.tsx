import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Activity, User, Target, Utensils, LogOut, Zap, Watch } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [wearableConnecting, setWearableConnecting] = useState(false);
  const [wearableConnections, setWearableConnections] = useState<{
    googleFit: boolean;
    fitbit: boolean;
  }>({ googleFit: false, fitbit: false });

  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    target_weight_kg: "",
    daily_calorie_goal: "2000",
    daily_protein_goal: "120",
    daily_carbs_goal: "250",
    daily_fats_goal: "65",
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const [profileRes, connectionsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("wearable_connections")
          .select("provider")
          .eq("user_id", user.id)
          .eq("is_active", true),
      ]);

      if (profileRes.error) throw profileRes.error;

      if (profileRes.data) {
        setFormData({
          full_name: profileRes.data.full_name || "",
          age: profileRes.data.age?.toString() || "",
          gender: profileRes.data.gender || "",
          height_cm: profileRes.data.height_cm?.toString() || "",
          weight_kg: profileRes.data.weight_kg?.toString() || "",
          target_weight_kg: profileRes.data.target_weight_kg?.toString() || "",
          daily_calorie_goal: profileRes.data.daily_calorie_goal?.toString() || "2000",
          daily_protein_goal: profileRes.data.daily_protein_goal?.toString() || "120",
          daily_carbs_goal: profileRes.data.daily_carbs_goal?.toString() || "250",
          daily_fats_goal: profileRes.data.daily_fats_goal?.toString() || "65",
        });
      }

      if (connectionsRes.data) {
        const providers = connectionsRes.data.map((conn: any) => conn.provider);
        setWearableConnections({
          googleFit: providers.includes("google_fit"),
          fitbit: providers.includes("fitbit"),
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleWearableConnect = async (provider: "google_fit" | "fitbit") => {
    setWearableConnecting(true);
    try {
      const mockToken = `mock_${provider}_${Date.now()}`;

      const { error } = await supabase
        .from("wearable_connections")
        .upsert(
          {
            user_id: user?.id,
            provider,
            access_token: mockToken,
            refresh_token: `refresh_${mockToken}`,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            last_sync: new Date().toISOString(),
            is_active: true,
          },
          { onConflict: "user_id,provider" }
        );

      if (error) throw error;

      setWearableConnections(prev => ({
        ...prev,
        [provider === "google_fit" ? "googleFit" : "fitbit"]: true,
      }));

      toast({
        title: "Connected!",
        description: `${provider === "google_fit" ? "Google Fit" : "Fitbit"} connected successfully.`,
      });

      const mockData = [
        { data_type: "steps", value: "12500", unit: "steps", sync_date: new Date().toISOString().split('T')[0] },
        { data_type: "calories", value: "2000", unit: "kcal", sync_date: new Date().toISOString().split('T')[0] },
        { data_type: "heart_rate", value: "72", unit: "bpm", sync_date: new Date().toISOString().split('T')[0] },
      ];

      await Promise.all(
        mockData.map(data =>
          supabase.from("health_data_sync").insert({
            user_id: user?.id || '',
            provider,
            sync_date: data.sync_date,
            steps: data.data_type === 'steps' ? parseInt(data.value) : null,
            calories_burned: data.data_type === 'calories' ? parseInt(data.value) : null,
            sleep_hours: data.data_type === 'sleep' ? parseFloat(data.value) : null,
            heart_rate_avg: data.data_type === 'heart_rate' ? parseInt(data.value) : null,
          })
        )
      );
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setWearableConnecting(false);
    }
  };

  const handleWearableDisconnect = async (provider: "google_fit" | "fitbit") => {
    try {
      const { error } = await supabase
        .from("wearable_connections")
        .update({ is_active: false })
        .eq("user_id", user?.id)
        .eq("provider", provider);

      if (error) throw error;

      setWearableConnections(prev => ({
        ...prev,
        [provider === "google_fit" ? "googleFit" : "fitbit"]: false,
      }));

      toast({
        title: "Disconnected",
        description: `${provider === "google_fit" ? "Google Fit" : "Fitbit"} disconnected.`,
      });
    } catch (error: any) {
      toast({
        title: "Disconnection failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null,
          height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          target_weight_kg: formData.target_weight_kg ? parseFloat(formData.target_weight_kg) : null,
          daily_calorie_goal: parseInt(formData.daily_calorie_goal),
          daily_protein_goal: parseInt(formData.daily_protein_goal),
          daily_carbs_goal: parseInt(formData.daily_carbs_goal),
          daily_fats_goal: parseInt(formData.daily_fats_goal),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your health profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <Activity className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">AI Health Mentor</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="text-muted-foreground mb-8">Manage your health information and goals</p>

          <form onSubmit={handleSave} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Basic information about you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="30"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height_cm">Height (cm)</Label>
                    <Input
                      id="height_cm"
                      type="number"
                      placeholder="175"
                      value={formData.height_cm}
                      onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight_kg">Weight (kg)</Label>
                    <Input
                      id="weight_kg"
                      type="number"
                      step="0.1"
                      placeholder="70"
                      value={formData.weight_kg}
                      onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Health Goals
                </CardTitle>
                <CardDescription>Set your daily nutrition targets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target_weight_kg">Target Weight (kg)</Label>
                  <Input
                    id="target_weight_kg"
                    type="number"
                    step="0.1"
                    placeholder="65"
                    value={formData.target_weight_kg}
                    onChange={(e) => setFormData({ ...formData, target_weight_kg: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="daily_calorie_goal">Daily Calories</Label>
                    <Input
                      id="daily_calorie_goal"
                      type="number"
                      value={formData.daily_calorie_goal}
                      onChange={(e) => setFormData({ ...formData, daily_calorie_goal: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="daily_protein_goal">Protein (g)</Label>
                    <Input
                      id="daily_protein_goal"
                      type="number"
                      value={formData.daily_protein_goal}
                      onChange={(e) => setFormData({ ...formData, daily_protein_goal: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="daily_carbs_goal">Carbs (g)</Label>
                    <Input
                      id="daily_carbs_goal"
                      type="number"
                      value={formData.daily_carbs_goal}
                      onChange={(e) => setFormData({ ...formData, daily_carbs_goal: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="daily_fats_goal">Fats (g)</Label>
                    <Input
                      id="daily_fats_goal"
                      type="number"
                      value={formData.daily_fats_goal}
                      onChange={(e) => setFormData({ ...formData, daily_fats_goal: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Watch className="w-5 h-5 text-primary" />
                  Wearable Devices
                </CardTitle>
                <CardDescription>Connect your fitness trackers to sync health data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-border/50 bg-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-primary" />
                          <span className="font-medium">Google Fit</span>
                        </div>
                        {wearableConnections.googleFit && (
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {wearableConnections.googleFit
                          ? "Connected - Syncing daily steps and activity"
                          : "Not connected"}
                      </p>
                      <Button
                        type="button"
                        variant={wearableConnections.googleFit ? "outline" : "default"}
                        disabled={wearableConnecting}
                        onClick={() =>
                          wearableConnections.googleFit
                            ? handleWearableDisconnect("google_fit")
                            : handleWearableConnect("google_fit")
                        }
                        className="w-full"
                      >
                        {wearableConnecting
                          ? "Connecting..."
                          : wearableConnections.googleFit
                          ? "Disconnect"
                          : "Connect"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 bg-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-primary" />
                          <span className="font-medium">Fitbit</span>
                        </div>
                        {wearableConnections.fitbit && (
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {wearableConnections.fitbit
                          ? "Connected - Syncing heart rate and sleep"
                          : "Not connected"}
                      </p>
                      <Button
                        type="button"
                        variant={wearableConnections.fitbit ? "outline" : "default"}
                        disabled={wearableConnecting}
                        onClick={() =>
                          wearableConnections.fitbit
                            ? handleWearableDisconnect("fitbit")
                            : handleWearableConnect("fitbit")
                        }
                        className="w-full"
                      >
                        {wearableConnecting
                          ? "Connecting..."
                          : wearableConnections.fitbit
                          ? "Disconnect"
                          : "Connect"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="submit" variant="hero" disabled={loading} className="flex-1">
                {loading ? "Saving..." : "Save Profile"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
