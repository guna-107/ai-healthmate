import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { toast } from "sonner";

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "Basic meal tracking",
        "Manual nutrition entry",
        "7-day history",
        "Health score tracking",
      ],
      tier: "free",
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "per month",
      description: "AI-powered insights",
      features: [
        "Everything in Free",
        "AI Food Recognition",
        "AI Chat Coach",
        "Personalized Recommendations",
        "Wearable Device Sync",
        "30-day history",
        "Advanced analytics",
      ],
      tier: "pro",
      popular: true,
    },
    {
      name: "Premium",
      price: "$19.99",
      period: "per month",
      description: "Complete health transformation",
      features: [
        "Everything in Pro",
        "Unlimited AI queries",
        "Social community access",
        "Leaderboard rankings",
        "Priority support",
        "Custom meal plans",
        "Unlimited history",
        "Export data",
      ],
      tier: "premium",
    },
  ];

  const handleSelectPlan = async (tier: string) => {
    if (!user) {
      toast.error("Please sign in to upgrade");
      navigate("/login");
      return;
    }

    setLoading(tier);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan: tier,
          status: tier === "free" ? "active" : "trial",
        });

      if (error) throw error;

      toast.success(`Successfully ${tier === "free" ? "downgraded to" : "upgraded to"} ${tier} plan!`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade as you grow. All plans include core health tracking features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.tier}
              className={`relative ${
                plan.popular
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.tier)}
                  disabled={loading === plan.tier}
                >
                  {loading === plan.tier ? "Processing..." : `Choose ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
