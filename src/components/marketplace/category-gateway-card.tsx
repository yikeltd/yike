import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type CategoryGatewayProps = {
  href?: string;
  onClick?: () => void;
  label: string;
  subtitle: string;
  imageSrc: string;
  selected?: boolean;
  /** Compact header chip (~80px) vs seller choose gateway (~128px). */
  size?: "compact" | "gateway";
  className?: string;
  priority?: boolean;
  role?: string;
  "aria-selected"?: boolean;
};

/**
 * Premium image-first category cover — homepage + seller choose.
 * Not a listing card. Not an icon button.
 */
export function CategoryGatewayCard({
  href,
  onClick,
  label,
  subtitle,
  imageSrc,
  selected = false,
  size = "compact",
  className,
  priority = false,
  role,
  "aria-selected": ariaSelected,
}: CategoryGatewayProps) {
  const isGateway = size === "gateway";
  const classNames = cn(
    "pressable group relative overflow-hidden rounded-2xl text-left transition-all duration-200",
    isGateway
      ? "min-h-[128px] shadow-[0_8px_28px_-10px_rgba(3,27,78,0.22)]"
      : "h-[80px] shadow-[0_4px_18px_rgba(3,27,78,0.1)]",
    selected
      ? "ring-2 ring-gold/65 shadow-[0_6px_20px_rgba(228,181,71,0.22)]"
      : "ring-1 ring-navy/[0.06] hover:ring-navy/12",
    className,
  );

  const body = (
    <>
      <Image
        src={imageSrc}
        alt=""
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03] group-active:scale-[1.01]"
        sizes={isGateway ? "(max-width: 480px) 100vw, 420px" : "(max-width: 480px) 50vw, 200px"}
        priority={priority}
      />
      <span
        aria-hidden
        className={cn(
          "absolute inset-0",
          isGateway
            ? "bg-gradient-to-t from-navy/90 via-navy/40 to-navy/15"
            : "bg-gradient-to-t from-navy/85 via-navy/35 to-navy/10",
        )}
      />
      <span
        className={cn(
          "absolute inset-x-0 bottom-0",
          isGateway ? "px-4 pb-3.5 pt-10" : "px-3 pb-2.5 pt-6",
        )}
      >
        <span
          className={cn(
            "block font-bold leading-tight tracking-tight text-white",
            isGateway ? "text-[18px]" : "text-[15px]",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "mt-0.5 block font-medium leading-tight text-white/70",
            isGateway ? "text-[12px]" : "text-[11px]",
          )}
        >
          {subtitle}
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classNames}
        onClick={onClick}
        role={role}
        aria-selected={ariaSelected}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classNames}
      onClick={onClick}
      role={role}
      aria-selected={ariaSelected}
    >
      {body}
    </button>
  );
}
