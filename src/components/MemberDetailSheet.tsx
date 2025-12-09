import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ArrowDownLeft, ArrowUpRight, HandCoins, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { AddTransactionForm } from "./AddTransactionForm";
import { EditTransactionDialog } from "./EditTransactionDialog";

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

interface MemberDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  currentUserId: string;
  transactions: Transaction[];
  onAddTransaction: (type: "borrow" | "lend" | "repayment", amount: number, note: string, date: Date) => Promise<void>;
  onEditTransaction: (id: string, amount: number, note: string, date: Date) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export const MemberDetailSheet = ({
  isOpen,
  onClose,
  memberName,
  currentUserId,
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: MemberDetailSheetProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Filter transactions with this member
  const memberTransactions = transactions.filter(
    (t) =>
      (t.from_user === currentUserId && t.to_user === memberName) ||
      (t.from_user === memberName && t.to_user === currentUserId)
  );

  // Calculate balance with this member
  const balance = memberTransactions.reduce((acc, t) => {
    if (t.from_user === currentUserId) {
      // I initiated this transaction
      if (t.type === "lend") {
        return acc + Number(t.amount); // They owe me
      } else if (t.type === "borrow") {
        return acc - Number(t.amount); // I owe them
      } else if (t.type === "repayment") {
        return acc - Number(t.amount); // I paid them back
      }
    } else {
      // They initiated this transaction
      if (t.type === "lend") {
        return acc - Number(t.amount); // I owe them (they lent to me)
      } else if (t.type === "borrow") {
        return acc + Number(t.amount); // They owe me (they borrowed from me)
      } else if (t.type === "repayment") {
        return acc + Number(t.amount); // They paid me back
      }
    }
    return acc;
  }, 0);

  const handleSettleUp = async () => {
    const absBalance = Math.abs(balance);
    if (absBalance === 0) return;
    
    // If balance is positive, they owe me, so they're repaying
    // If balance is negative, I owe them, so I'm repaying
    await onAddTransaction("repayment", absBalance, "Settled up", new Date());
  };

  const getTransactionDisplay = (t: Transaction) => {
    const isMyTransaction = t.from_user === currentUserId;
    const displayDate = t.transaction_date ? new Date(t.transaction_date) : new Date(t.created_at);
    
    let icon, colorClass, label, amountPrefix;
    
    if (t.type === "repayment") {
      icon = <HandCoins className="w-4 h-4 text-primary" />;
      colorClass = "text-primary";
      label = isMyTransaction ? "You paid back" : `${memberName} paid back`;
      amountPrefix = "";
    } else if (t.type === "lend") {
      if (isMyTransaction) {
        icon = <ArrowUpRight className="w-4 h-4 text-lent-accent" />;
        colorClass = "text-lent-accent";
        label = "You lent";
        amountPrefix = "+";
      } else {
        icon = <ArrowDownLeft className="w-4 h-4 text-borrowed-accent" />;
        colorClass = "text-borrowed-accent";
        label = `${memberName} lent you`;
        amountPrefix = "-";
      }
    } else {
      if (isMyTransaction) {
        icon = <ArrowDownLeft className="w-4 h-4 text-borrowed-accent" />;
        colorClass = "text-borrowed-accent";
        label = "You borrowed";
        amountPrefix = "-";
      } else {
        icon = <ArrowUpRight className="w-4 h-4 text-lent-accent" />;
        colorClass = "text-lent-accent";
        label = `${memberName} borrowed`;
        amountPrefix = "+";
      }
    }

    return { icon, colorClass, label, amountPrefix, displayDate };
  };

  const handleClose = () => {
    setShowAddForm(false);
    setEditingTransaction(null);
    onClose();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-bold text-lg">
                {memberName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="text-lg">{memberName}</span>
                <p className={`text-sm font-semibold ${balance > 0 ? "text-lent-accent" : balance < 0 ? "text-borrowed-accent" : "text-muted-foreground"}`}>
                  {balance > 0 
                    ? `Owes you ₹${balance.toLocaleString("en-IN")}`
                    : balance < 0 
                    ? `You owe ₹${Math.abs(balance).toLocaleString("en-IN")}`
                    : "All settled up!"}
                </p>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Settle Up Button */}
          {balance !== 0 && (
            <div className="p-4 border-b border-border">
              <Button 
                onClick={handleSettleUp}
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <HandCoins className="w-5 h-5 mr-2" />
                Settle Up (₹{Math.abs(balance).toLocaleString("en-IN")})
              </Button>
            </div>
          )}

          {/* Transaction History */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {memberTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No transactions yet</p>
                  <p className="text-xs mt-1">Tap + to add your first transaction</p>
                </div>
              ) : (
                memberTransactions
                  .sort((a, b) => {
                    const dateA = a.transaction_date || a.created_at;
                    const dateB = b.transaction_date || b.created_at;
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                  })
                  .map((t) => {
                    const { icon, colorClass, label, amountPrefix, displayDate } = getTransactionDisplay(t);
                    return (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl bg-card border border-border group relative"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium text-foreground truncate">
                                {t.note || label}
                              </p>
                              <span className={`font-bold ${colorClass} whitespace-nowrap`}>
                                {amountPrefix}₹{Number(t.amount).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {label} • {format(displayDate, "d MMM yyyy")}
                            </p>
                          </div>
                        </div>
                        {/* Edit/Delete buttons */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={() => setEditingTransaction(t)}
                            className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(t.id)}
                            className="p-1.5 rounded-lg bg-borrowed/50 hover:bg-borrowed text-borrowed-accent transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </ScrollArea>

          {/* Add Transaction Form or Button */}
          <div className="p-4 border-t border-border bg-background">
            {showAddForm ? (
              <AddTransactionForm
                memberName={memberName}
                onSave={async (type, amount, note, date) => {
                  await onAddTransaction(type, amount, note, date);
                  setShowAddForm(false);
                }}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full h-12 rounded-xl font-bold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Transaction
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
        onSave={async (amount, note, date) => {
          if (editingTransaction) {
            await onEditTransaction(editingTransaction.id, amount, note, date);
            setEditingTransaction(null);
          }
        }}
      />
    </>
  );
};
