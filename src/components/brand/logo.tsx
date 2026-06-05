import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

export function Logo({
  size = 36,
  showText = true,
  className,
  href = "/",
}: {
  size?: number;
  showText?: boolean;
  className?: string;
  href?: string;
}) {
  const content = (
    <>
      <Image
        src={brand.logo}
        alt={`${brand.name} logo`}
        width={size}
        height={size}
        className="object-contain"
        priority
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
      >
        {content}
      </Link>
    );
  }

  return <div className={cn("flex items-center gap-2", className)}>{content}</div>;
}
