import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  amount: number;
  note: string | null;
  transaction_date: string | null;
  created_at: string;
}

interface EditTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (amount: number, note: string, date: Date) => Promise<void>;
}

const transactionSchema = z.object({
  amount: z.number().min(1, "Amount must be at least ₹1").max(1000000, "Amount too large"),
  note: z.string().max(200, "Note must be under 200 characters").optional(),
});

export const EditTransactionDialog = ({
  isOpen,
  onClose,
  transaction,
  onSave,
}: EditTransactionDialogProps) => {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount));
      setNote(transaction.note || "");
      setDate(
        transaction.transaction_date
          ? new Date(transaction.transaction_date)
          : new Date(transaction.created_at)
      );
    }
  }, [transaction]);

  const handleSave = async () => {
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
    await onSave(parsedAmount, note.trim(), date);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
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
            <Label className="text-xs font-semibold">Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was this for?"
              className="rounded-xl resize-none text-sm"
              rows={2}
              maxLength={200}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!amount || loading}
              className="flex-1 h-10 rounded-xl font-bold"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
