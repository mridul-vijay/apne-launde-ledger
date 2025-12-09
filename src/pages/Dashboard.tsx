import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/SummaryCard";
import { MemberCard } from "@/components/MemberCard";
import { TransactionModal } from "@/components/TransactionModal";
import { Wallet, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const MEMBERS = ["Arun", "Vivek", "Nidit", "Kunal", "Manan", "Amit", "Akshit", "Shan", "Pratik", "Parikshit", "Mridul"];

interface Transaction {
  id: string;
  from_user: string;
  to_user: string;
  type: "borrow" | "lend";
  amount: number;
  note: string | null;
  created_at: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentAlId, setCurrentAlId] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchUserProfile(session.user.id);
        fetchTransactions();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("al_id")
      .eq("id", userId)
      .single();
    
    if (data) {
      setCurrentAlId(data.al_id);
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setTransactions(data as Transaction[]);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "See you later!",
    });
    navigate("/auth");
  };

  const handleMemberClick = (member: string) => {
    if (member !== currentAlId) {
      setSelectedMember(member);
    }
  };

  const handleTransactionSave = async (type: "borrow" | "lend", amount: number, note: string) => {
    if (!user || !selectedMember) return;

    const transaction = {
      from_user: currentAlId,
      to_user: selectedMember,
      type,
      amount,
      note: note || null,
      user_id: user.id,
    };

    const { error } = await supabase.from("transactions").insert(transaction);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Transaction Saved!",
      description: `₹${amount} ${type === "borrow" ? "borrowed from" : "lent to"} ${selectedMember}`,
    });

    fetchTransactions();
    setSelectedMember(null);
  };

  // Calculate totals
  const totalBorrowed = transactions
    .filter((t) => t.type === "borrow")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalLent = transactions
    .filter((t) => t.type === "lend")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container max-w-2xl py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-soft">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">Apne Launde</h1>
              <p className="text-xs text-muted-foreground">Hey, {currentAlId}!</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container max-w-2xl pt-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          <SummaryCard
            label="Total Borrowed"
            amount={totalBorrowed}
            type="borrowed"
          />
          <SummaryCard
            label="Total Lent"
            amount={totalLent}
            type="lent"
          />
        </div>

        {/* Members Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Members</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MEMBERS.map((member, index) => (
              <MemberCard
                key={member}
                name={member}
                isCurrentUser={member === currentAlId}
                onClick={() => handleMemberClick(member)}
                delay={index * 50}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        memberName={selectedMember || ""}
        onSave={handleTransactionSave}
      />
    </div>
  );
};

export default Dashboard;
