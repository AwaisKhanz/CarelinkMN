"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  profileImage?: string;
  organizationLogo?: string;
  firstName?: string;
  lastName?: string;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  profileImage,
  organizationLogo,
  firstName,
  lastName,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  // Priority: profileImage → organizationLogo → initials
  const avatarUrl = profileImage || organizationLogo;
  
  const initials = [firstName?.[0], lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "?";

  return (
    <Avatar className={cn("h-10 w-10", className)}>
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
          alt={`${firstName || ""} ${lastName || ""}`.trim() || "User"} 
        />
      )}
      <AvatarFallback className={cn("bg-primary text-primary-foreground", fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
