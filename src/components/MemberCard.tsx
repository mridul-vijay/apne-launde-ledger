import { User } from "lucide-react";

interface MemberCardProps {
  name: string;
  isCurrentUser: boolean;
  onClick: () => void;
  delay?: number;
}

export const MemberCard = ({ name, isCurrentUser, onClick, delay = 0 }: MemberCardProps) => {
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onClick}
      disabled={isCurrentUser}
      className={`relative p-4 rounded-2xl flex flex-col items-center gap-3 transition-all animate-slide-up ${
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
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        {initials}
      </div>
      <span className="font-semibold text-foreground text-sm">{name}</span>
    </button>
  );
};
