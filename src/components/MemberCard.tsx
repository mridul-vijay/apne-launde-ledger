import { User } from "lucide-react";

interface MemberCardProps {
  name: string;
  isCurrentUser: boolean;
  balance: number;
  onClick: () => void;
  delay?: number;
}

export const MemberCard = ({ name, isCurrentUser, balance, onClick, delay = 0 }: MemberCardProps) => {
  const initials = name.slice(0, 2).toUpperCase();

  const getBalanceDisplay = () => {
    if (balance === 0) return null;
    if (balance > 0) {
      return (
        <span className="text-xs font-semibold text-lent-accent">
          +₹{balance.toLocaleString("en-IN")}
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold text-borrowed-accent">
        -₹{Math.abs(balance).toLocaleString("en-IN")}
      </span>
    );
  };

  return (
    <button
      onClick={onClick}
      disabled={isCurrentUser}
      className={`relative p-4 rounded-2xl flex flex-col items-center gap-2 transition-all animate-slide-up ${
        isCurrentUser ? "member-card-active" : "member-card"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {isCurrentUser && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full shadow-soft">
          YOU
        </span>
      )}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
          isCurrentUser
            ? "bg-primary text-primary-foreground"
            : balance > 0
            ? "bg-lent/50 text-lent-accent border-2 border-lent-accent/30"
            : balance < 0
            ? "bg-borrowed/50 text-borrowed-accent border-2 border-borrowed-accent/30"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        {initials}
      </div>
      <span className="font-semibold text-foreground text-sm">{name}</span>
      {!isCurrentUser && getBalanceDisplay()}
    </button>
  );
};
