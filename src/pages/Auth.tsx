import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Wallet, Users, ArrowLeftRight } from "lucide-react";
import { z } from "zod";

const MEMBERS = ["Arun", "Vivek", "Nidit", "Kunal", "Manan", "Amit", "Akshit", "Shan", "Pratik", "Parikshit", "Mridul"];

const authSchema = z.object({
  alId: z.string()
    .min(1, "AL ID is required")
    .refine((val) => MEMBERS.includes(val), {
      message: "Please select a valid member name"
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthMode = "signin" | "signup";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [alId, setAlId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ alId, password });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const email = `${alId.toLowerCase()}@apnelaunde.app`;

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account Exists",
              description: "This AL ID is already registered. Please sign in.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }

        if (data.user) {
          await supabase.from("profiles").insert({
            id: data.user.id,
            al_id: alId,
          });

          toast({
            title: "Account Created!",
            description: "You can now sign in with your credentials.",
          });
          setMode("signin");
          setPassword("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login")) {
            toast({
              title: "Invalid Credentials",
              description: "Wrong AL ID or password. Please try again.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "Welcome back!",
          description: `Good to see you, ${alId}!`,
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo & Branding */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-glow">
            <Wallet className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">Apne Launde</h1>
            <p className="text-lg font-semibold text-primary">Finance Tracker</p>
          </div>
        </div>

        {/* Features */}
        <div className="flex justify-center gap-6 text-muted-foreground">
          <div className="flex flex-col items-center gap-1">
            <Users className="w-5 h-5" />
            <span className="text-xs">11 Members</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-xs">Track Money</span>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="border-2 shadow-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {mode === "signup" ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {mode === "signup" ? "Pick your name to get started" : "Sign in to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="alId" className="text-sm font-semibold">
                  AL ID (Your Name)
                </Label>
                <select
                  id="alId"
                  value={alId}
                  onChange={(e) => setAlId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-input bg-background text-foreground font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                >
                  <option value="">Select your name</option>
                  {MEMBERS.map((member) => (
                    <option key={member} value={member}>
                      {member}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 rounded-xl border-2 font-medium"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-base font-bold shadow-soft hover:shadow-card transition-all"
              >
                {loading ? "Please wait..." : mode === "signup" ? "Sign Up" : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signup" ? "signin" : "signup");
                  setPassword("");
                }}
                className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors"
              >
                {mode === "signup"
                  ? "Already have an account? Sign In"
                  : "New here? Create Account"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
