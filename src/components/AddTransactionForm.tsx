import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowDownLeft, ArrowUpRight, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

interface AddTransactionFormProps {
  memberName: string;
  onSave: (type: "borrow" | "lend", amount: number, note: string, date: Date) => Promise<void>;
  onCancel: () => void;
}

const transactionSchema = z.object({
  amount: z.number().min(1, "Amount must be at least ₹1").max(1000000, "Amount too large"),
  note: z.string().max(200, "Note must be under 200 characters").optional(),
});

export const AddTransactionForm = ({ memberName, onSave, onCancel }: AddTransactionFormProps) => {
  const [type, setType] = useState<"borrow" | "lend" | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!type) return;

    const parsedAmount = parseFloat(amount);
    const validation = transactionSchema.safeParse({
      amount: parsedAmount,
      note: note.trim(),
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
    await onSave(type, parsedAmount, note.trim(), date);
    setLoading(false);
  };

  if (!type) {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Select transaction type</p>
          <button onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setType("borrow")}
            className="p-4 rounded-xl summary-borrowed border-2 border-borrowed-accent/30 hover:border-borrowed-accent transition-all flex flex-col items-center gap-2"
          >
            <ArrowDownLeft className="w-6 h-6 text-borrowed-accent" />
            <span className="font-semibold text-sm">I Borrowed</span>
          </button>
          <button
            onClick={() => setType("lend")}
            className="p-4 rounded-xl summary-lent border-2 border-lent-accent/30 hover:border-lent-accent transition-all flex flex-col items-center gap-2"
          >
            <ArrowUpRight className="w-6 h-6 text-lent-accent" />
            <span className="font-semibold text-sm">I Lent</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            type === "borrow" ? "bg-borrowed" : "bg-lent"
          }`}
        >
          {type === "borrow" ? (
            <ArrowDownLeft className="w-4 h-4 text-borrowed-accent" />
          ) : (
            <ArrowUpRight className="w-4 h-4 text-lent-accent" />
          )}
          <span className="text-sm font-semibold">
            {type === "borrow" ? "Borrowing from" : "Lending to"} {memberName}
          </span>
        </div>
        <button onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Amount (₹)</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="h-11 text-lg font-bold rounded-xl"
            min={1}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-11 justify-start text-left font-medium rounded-xl",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "d MMM")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Note (Optional)</Label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was this for? (e.g., Pizza, Cab)"
          className="rounded-xl resize-none text-sm"
          rows={2}
          maxLength={200}
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setType(null)}
          className="flex-1 h-10 rounded-xl font-semibold"
        >
          Back
        </Button>
        <Button
          onClick={handleSave}
          disabled={!amount || loading}
          className="flex-1 h-10 rounded-xl font-bold"
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
