import { TrendingDown, TrendingUp } from "lucide-react";

interface SummaryCardProps {
  label: string;
  amount: number;
  type: "borrowed" | "lent";
}

export const SummaryCard = ({ label, amount, type }: SummaryCardProps) => {
  const isBorrowed = type === "borrowed";

  return (
    <div
      className={`rounded-2xl p-4 border-2 transition-all ${
        isBorrowed ? "summary-borrowed" : "summary-lent"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {isBorrowed ? (
          <TrendingDown className="w-4 h-4 text-borrowed-accent" />
        ) : (
          <TrendingUp className="w-4 h-4 text-lent-accent" />
        )}
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p
        className={`text-2xl font-extrabold ${
          isBorrowed ? "text-borrowed-accent" : "text-foreground"
        }`}
      >
        ₹{amount.toLocaleString("en-IN")}
      </p>
    </div>
  );
};
