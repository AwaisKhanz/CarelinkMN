"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  providerId: string;
  isFavorite: boolean;
  onToggle: (providerId: string, isFavorite: boolean) => void;
  variant?: "default" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function FavoriteButton({
  providerId,
  isFavorite,
  onToggle,
  variant = "ghost",
  size = "icon",
}: FavoriteButtonProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isToggling) return;

    setIsToggling(true);
    try {
      await onToggle(providerId, !isFavorite);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isToggling}
      className={cn(
        "transition-colors",
        isFavorite && "text-destructive hover:text-destructive"
      )}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          "w-4 h-4 transition-all",
          isFavorite && "fill-current"
        )}
      />
    </Button>
  );
}

