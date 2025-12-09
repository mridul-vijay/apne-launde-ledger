import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, LogOut } from "lucide-react";
import { z } from "zod";

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentAlId: string;
  onSignOut: () => void;
}

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const SettingsSheet = ({ isOpen, onClose, currentAlId, onSignOut }: SettingsSheetProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    const validation = passwordSchema.safeParse({ newPassword, confirmPassword });
    
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Updated!",
        description: "Your password has been changed successfully.",
      });
      setNewPassword("");
      setConfirmPassword("");
    }
    
    setLoading(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center font-bold text-lg text-primary-foreground">
              {currentAlId.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-lg">{currentAlId}</span>
              <p className="text-sm text-muted-foreground font-normal">Account Settings</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Change Password Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Change Password</h3>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">New Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="h-11 rounded-xl pr-10"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Confirm Password</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-11 rounded-xl"
                  minLength={6}
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={!newPassword || !confirmPassword || loading}
                className="w-full h-11 rounded-xl font-semibold"
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Sign Out */}
          <Button
            variant="outline"
            onClick={onSignOut}
            className="w-full h-11 rounded-xl font-semibold text-borrowed-accent border-borrowed-accent/30 hover:bg-borrowed hover:text-borrowed-accent hover:border-borrowed-accent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
