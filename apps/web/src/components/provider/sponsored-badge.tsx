import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface SponsoredBadgeProps {
  boostLevel: number;
  className?: string;
}

export function SponsoredBadge({ boostLevel, className }: SponsoredBadgeProps) {
  if (boostLevel === 0) {
    return null;
  }

  return (
    <Badge
      variant="secondary"
      className={`text-xs font-medium bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border-amber-300 ${className || ""}`}
    >
      <Sparkles className="h-3 w-3 mr-1" />
      Sponsored
    </Badge>
  );
}
