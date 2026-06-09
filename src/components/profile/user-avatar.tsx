import Image from "next/image";
import { avatarDisplayUrl } from "@/lib/profile/media-urls";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
  ring,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  ring?: boolean;
}) {
  const label = name?.trim() || "User";
  const initial = label.charAt(0).toUpperCase();
  const src = avatarDisplayUrl(avatarUrl);
  const sizeClass = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-base",
    lg: "h-20 w-20 text-2xl",
    xl: "h-28 w-28 text-3xl",
  }[size];

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-gold/30 to-navy/10",
        sizeClass,
        ring && "ring-4 ring-white shadow-float-lg",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={label}
          fill
          sizes={size === "xl" ? "112px" : size === "lg" ? "80px" : size === "md" ? "48px" : "32px"}
          className="object-cover"
          decoding="async"
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-bold text-navy">
          {initial}
        </span>
      )}
    </div>
  );
}
