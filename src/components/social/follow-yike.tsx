import type { ReactNode } from "react";
import { SOCIAL_LINKS, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SocialKey = keyof typeof SOCIAL_LINKS;

const SOCIAL_META: Record<SocialKey, { label: string; icon: ReactNode }> = {
  facebook: {
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.027 4.388 11.023 10.125 11.93v-8.437H7.078v-3.493h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953h-1.513c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.493h-2.796v8.437C19.612 23.096 24 18.1 24 12.073z" />
      </svg>
    ),
  },
  instagram: {
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.427.403a4.92 4.92 0 0 1 1.675 1.089 4.92 4.92 0 0 1 1.089 1.675c.163.457.349 1.257.403 2.427.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.427a4.92 4.92 0 0 1-1.089 1.675 4.92 4.92 0 0 1-1.675 1.089c-.457.163-1.257.349-2.427.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.427-.403a4.92 4.92 0 0 1-1.675-1.089 4.92 4.92 0 0 1-1.089-1.675c-.163-.457-.349-1.257-.403-2.427C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.427a4.92 4.92 0 0 1 1.089-1.675A4.92 4.92 0 0 1 5.34 2.636c.457-.163 1.257-.349 2.427-.403C9.033 2.175 9.413 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 5.775.13 4.902.333 4.14.63a6.96 6.96 0 0 0-2.54 1.65 6.96 6.96 0 0 0-1.65 2.54C.13 4.902-.133 5.775-.072 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.061 1.277.264 2.15.561 2.912a6.96 6.96 0 0 0 1.65 2.54 6.96 6.96 0 0 0 2.54 1.65c.762.297 1.635.5 2.912.561C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 1.277-.061 2.15-.264 2.912-.561a6.96 6.96 0 0 0 2.54-1.65 6.96 6.96 0 0 0 1.65-2.54c.297-.762.5-1.635.561-2.912.058-1.28.072-1.689.072-4.948 0-3.259-.014-3.668-.072-4.948-.061-1.277-.264-2.15-.561-2.912a6.96 6.96 0 0 0-1.65-2.54 6.96 6.96 0 0 0-2.54-1.65c-.762-.297-1.635-.5-2.912-.561C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  x: {
    label: "X",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  youtube: {
    label: "YouTube",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  tiktok: {
    label: "TikTok",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.12c0 3.34-2.57 6.22-5.96 6.45-3.38.24-6.47-2.02-6.89-5.38-.5-3.89 2.38-7.17 6.12-7.17 1.23 0 2.38.37 3.34.99V9.01c-.67-.22-1.37-.34-2.09-.35-2.28 0-4.14 1.87-4.14 4.15 0 2.28 1.86 4.14 4.14 4.14 2.28 0 4.13-1.86 4.13-4.14V.02h.04z" />
      </svg>
    ),
  },
};

const ORDER: SocialKey[] = [
  "tiktok",
  "x",
  "youtube",
  "instagram",
  "facebook",
];

type FollowYikeProps = {
  title?: string;
  variant?: "row" | "icons" | "footer";
  className?: string;
};

export function FollowYike({
  title = `Follow ${SITE_NAME}`,
  variant = "row",
  className,
}: FollowYikeProps) {
  return (
    <div className={className}>
      {title && (
        <p
          className={cn(
            "font-bold text-navy",
            variant === "footer" ? "text-xs uppercase tracking-wider text-muted" : "text-sm"
          )}
        >
          {title}
        </p>
      )}
      <div
        className={cn(
          "flex flex-wrap gap-2",
          title && "mt-3",
          variant === "icons" && "gap-3"
        )}
      >
        {ORDER.map((key) => {
          const meta = SOCIAL_META[key];
          const href = SOCIAL_LINKS[key];
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${SITE_NAME} on ${meta.label}`}
              className={cn(
                "pressable inline-flex items-center gap-2 transition-colors",
                variant === "footer"
                  ? "rounded-full p-2 text-muted hover:bg-surface hover:text-gold-dark"
                  : variant === "icons"
                    ? "h-11 w-11 items-center justify-center rounded-xl bg-navy/5 text-navy hover:bg-gold/15 hover:text-navy"
                    : "rounded-full bg-surface px-3 py-2 text-sm font-semibold text-navy hover:bg-gold/10"
              )}
            >
              {meta.icon}
              {variant === "row" && <span>{meta.label}</span>}
            </a>
          );
        })}
      </div>
    </div>
  );
}
