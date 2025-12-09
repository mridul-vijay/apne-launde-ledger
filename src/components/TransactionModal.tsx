import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  onSave: (type: "borrow" | "lend", amount: number, note: string) => void;
}

const transactionSchema = z.object({
  amount: z.number().min(1, "Amount must be at least ₹1").max(1000000, "Amount too large"),
  note: z.string().max(200, "Note must be under 200 characters").optional(),
});

export const TransactionModal = ({
  isOpen,
  onClose,
  memberName,
  onSave,
}: TransactionModalProps) => {
  const [step, setStep] = useState<"select" | "input">("select");
  const [type, setType] = useState<"borrow" | "lend" | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTypeSelect = (selectedType: "borrow" | "lend") => {
    setType(selectedType);
    setStep("input");
  };

  const handleSave = async () => {
    if (!type) return;

    const parsedAmount = parseFloat(amount);
    const validation = transactionSchema.safeParse({ 
      amount: parsedAmount, 
      note: note.trim() 
    });

    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    await onSave(type, parsedAmount, note.trim());
    setLoading(false);
    handleClose();
  };

  const handleClose = () => {
    setStep("select");
    setType(null);
    setAmount("");
    setNote("");
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-secondary-foreground" />
            </div>
            <span>Transaction with {memberName}</span>
          </SheetTitle>
        </SheetHeader>

        {step === "select" ? (
          <div className="grid grid-cols-2 gap-4 pt-4 animate-fade-in">
            <button
              onClick={() => handleTypeSelect("borrow")}
              className="p-6 rounded-2xl summary-borrowed border-2 border-borrowed-accent/30 hover:border-borrowed-accent transition-all flex flex-col items-center gap-3"
            >
              <div className="w-14 h-14 rounded-xl bg-borrowed-accent/20 flex items-center justify-center">
                <ArrowDownLeft className="w-7 h-7 text-borrowed-accent" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">Borrowed Money</p>
                <p className="text-xs text-muted-foreground">I took from {memberName}</p>
              </div>
            </button>

            <button
              onClick={() => handleTypeSelect("lend")}
              className="p-6 rounded-2xl summary-lent border-2 border-lent-accent/30 hover:border-lent-accent transition-all flex flex-col items-center gap-3"
            >
              <div className="w-14 h-14 rounded-xl bg-lent-accent/20 flex items-center justify-center">
                <ArrowUpRight className="w-7 h-7 text-lent-accent" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">Lent Money</p>
                <p className="text-xs text-muted-foreground">I gave to {memberName}</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-5 pt-4 animate-fade-in">
            <div
              className={`p-3 rounded-xl flex items-center gap-3 ${
                type === "borrow" ? "bg-borrowed" : "bg-lent"
              }`}
            >
              {type === "borrow" ? (
                <ArrowDownLeft className="w-5 h-5 text-borrowed-accent" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-lent-accent" />
              )}
              <span className="font-semibold text-foreground">
                {type === "borrow" ? "Borrowing from" : "Lending to"} {memberName}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-semibold">
                Amount (₹)
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-14 text-xl font-bold rounded-xl border-2"
                min={1}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm font-semibold">
                Note (Optional)
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What was this for?"
                className="rounded-xl border-2 resize-none"
                rows={3}
                maxLength={200}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep("select")}
                className="flex-1 h-12 rounded-xl font-semibold"
              >
                Back
              </Button>
              <Button
                onClick={handleSave}
                disabled={!amount || loading}
                className="flex-1 h-12 rounded-xl font-bold"
              >
                {loading ? "Saving..." : "Save Transaction"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
