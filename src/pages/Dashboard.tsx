import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { SummaryCard } from "@/components/SummaryCard";
import { MemberCard } from "@/components/MemberCard";
import { MemberDetailSheet } from "@/components/MemberDetailSheet";
import { SettingsSheet } from "@/components/SettingsSheet";
import { Wallet, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const MEMBERS = ["Arun", "Vivek", "Nidit", "Kunal", "Manan", "Amit", "Akshit", "Shan", "Pratik", "Parikshit", "Mridul"];

interface Transaction {
  id: string;
  from_user: string;
  to_user: string;
  type: "borrow" | "lend" | "repayment";
  amount: number;
  note: string | null;
  created_at: string;
  transaction_date: string | null;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentAlId, setCurrentAlId] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
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

  const handleAddTransaction = async (type: "borrow" | "lend" | "repayment", amount: number, note: string, date: Date) => {
    if (!user || !selectedMember) return;

    const transaction = {
      from_user: currentAlId,
      to_user: selectedMember,
      type,
      amount,
      note: note || null,
      user_id: user.id,
      transaction_date: format(date, "yyyy-MM-dd"),
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

    const typeLabel = type === "repayment" ? "settled up with" : type === "borrow" ? "borrowed from" : "lent to";
    toast({
      title: "Transaction Saved!",
      description: `₹${amount} ${typeLabel} ${selectedMember}`,
    });

    fetchTransactions();
  };

  const handleEditTransaction = async (id: string, amount: number, note: string, date: Date) => {
    const { error } = await supabase
      .from("transactions")
      .update({
        amount,
        note: note || null,
        transaction_date: format(date, "yyyy-MM-dd"),
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Transaction Updated!",
      description: "Changes saved successfully",
    });

    fetchTransactions();
  };

  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Transaction Deleted",
      description: "The transaction has been removed",
    });

    fetchTransactions();
  };

  // Calculate balance with each member
  const getMemberBalance = (member: string): number => {
    const memberTransactions = transactions.filter(
      (t) =>
        (t.from_user === currentAlId && t.to_user === member) ||
        (t.from_user === member && t.to_user === currentAlId)
    );

    return memberTransactions.reduce((acc, t) => {
      if (t.from_user === currentAlId) {
        if (t.type === "lend") return acc + Number(t.amount);
        if (t.type === "borrow") return acc - Number(t.amount);
        if (t.type === "repayment") return acc - Number(t.amount);
      } else {
        if (t.type === "lend") return acc - Number(t.amount);
        if (t.type === "borrow") return acc + Number(t.amount);
        if (t.type === "repayment") return acc + Number(t.amount);
      }
      return acc;
    }, 0);
  };

  // Calculate totals
  const totalOwedToMe = MEMBERS.filter(m => m !== currentAlId)
    .reduce((sum, m) => {
      const balance = getMemberBalance(m);
      return sum + (balance > 0 ? balance : 0);
    }, 0);

  const totalIOwe = MEMBERS.filter(m => m !== currentAlId)
    .reduce((sum, m) => {
      const balance = getMemberBalance(m);
      return sum + (balance < 0 ? Math.abs(balance) : 0);
    }, 0);

  // Sort members: those with non-zero balance first, then by absolute balance
  const sortedMembers = [...MEMBERS].sort((a, b) => {
    if (a === currentAlId) return -1;
    if (b === currentAlId) return 1;
    
    const balanceA = getMemberBalance(a);
    const balanceB = getMemberBalance(b);
    
    // Non-zero balances come first
    if (balanceA !== 0 && balanceB === 0) return -1;
    if (balanceA === 0 && balanceB !== 0) return 1;
    
    // Sort by absolute balance (larger first)
    return Math.abs(balanceB) - Math.abs(balanceA);
  });

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
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="container max-w-2xl pt-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          <SummaryCard
            label="You Owe"
            amount={totalIOwe}
            type="borrowed"
          />
          <SummaryCard
            label="Owed to You"
            amount={totalOwedToMe}
            type="lent"
          />
        </div>

        {/* Members Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Members</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sortedMembers.map((member, index) => (
              <MemberCard
                key={member}
                name={member}
                isCurrentUser={member === currentAlId}
                balance={member === currentAlId ? 0 : getMemberBalance(member)}
                onClick={() => handleMemberClick(member)}
                delay={index * 50}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Member Detail Sheet */}
      <MemberDetailSheet
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        memberName={selectedMember || ""}
        currentUserId={currentAlId}
        transactions={transactions}
        onAddTransaction={handleAddTransaction}
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
      />

      {/* Settings Sheet */}
      <SettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentAlId={currentAlId}
        onSignOut={handleSignOut}
      />
    </div>
  );
};

export default Dashboard;
