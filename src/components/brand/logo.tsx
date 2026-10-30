import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: number;
  showText?: boolean;
  className?: string;
  href?: string | null;
  /** Use smaller derivative for crisp nav/footer marks */
  variant?: "default" | "sm";
  priority?: boolean;
};

export function Logo({
  size = 36,
  showText = true,
  className,
  href = "/",
  variant = "default",
  priority = true,
}: LogoProps) {
  const src = variant === "sm" || size <= 40 ? brand.logoSm : brand.logo;
  const dimension = size;

  const content = (
    <>
      <Image
        src={src}
        alt={brand.logoAlt}
        width={dimension}
        height={dimension}
        className="object-contain"
        priority={priority}
      />
      {showText && (
        <span className="text-lg font-bold tracking-tight">{brand.name}</span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("flex items-center gap-2 touch-feedback", className)}
        aria-label={`${brand.name} home`}
      >
        {content}
      </Link>
    );
  }

  return <div className={cn("flex items-center gap-2", className)}>{content}</div>;
}
