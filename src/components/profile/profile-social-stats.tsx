import Link from "next/link";
import { Heart, Shield, Users } from "lucide-react";
import type { ProfileSocialStats } from "@/lib/social/types";
import { cn } from "@/lib/utils";

export function ProfileSocialStats({
  stats,
  className,
  centered,
  showLinks,
  variant = "default",
  verifiedLevel,
}: {
  stats: ProfileSocialStats;
  className?: string;
  centered?: boolean;
  showLinks?: boolean;
  /** Visual only */
  variant?: "default" | "private" | "executive";
  /** Display-only verified level for executive panel (e.g. BASIC) */
  verifiedLevel?: string | null;
}) {
  const followers = stats.followersCount;
  const likes = stats.listingLikesCount;

  if (variant === "executive") {
    const level = (verifiedLevel ?? "Basic").trim().toUpperCase();
    const followersBody = (
      <ExecutiveStat
        icon={Users}
        value={String(followers)}
        label={followers === 1 ? "Follower" : "Followers"}
        accent="gold"
      />
    );
    const likesBody = (
      <ExecutiveStat
        icon={Heart}
        value={String(likes)}
        label={likes === 1 ? "Listing Like" : "Listing Likes"}
        accent="rose"
        divider
      />
    );

    return (
      <div
        className={cn(
          "grid grid-cols-3 overflow-hidden rounded-2xl border border-gold/25",
          "bg-navy-mid/80 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--gold)_18%,transparent)]",
          centered && "mx-auto max-w-xl",
          className
        )}
      >
        {showLinks ? (
          <Link
            href="/agent/followers"
            className="group outline-none transition-colors duration-200 hover:bg-navy-light/40 focus-visible:bg-navy-light/50"
            aria-label={`${followers} ${followers === 1 ? "follower" : "followers"}`}
          >
            {followersBody}
          </Link>
        ) : (
          followersBody
        )}
        {showLinks ? (
          <Link
            href="/agent/likes"
            className="group outline-none transition-colors duration-200 hover:bg-navy-light/40 focus-visible:bg-navy-light/50"
            aria-label={`${likes} ${likes === 1 ? "listing like" : "listing likes"}`}
          >
            {likesBody}
          </Link>
        ) : (
          likesBody
        )}
        <ExecutiveStat
          icon={Shield}
          value={level}
          label="Verified Level"
          accent="gold"
          divider
          valueAsLabel
        />
      </div>
    );
  }

  const privateBank = variant === "private";

  const followersCard = (
    <StatCard
      icon={Users}
      value={followers}
      label={followers === 1 ? "Follower" : "Followers"}
      tone={privateBank ? "private" : "sky"}
    />
  );

  const likesCard = (
    <StatCard
      icon={Heart}
      value={likes}
      label={likes === 1 ? "Listing Like" : "Listing Likes"}
      tone={privateBank ? "private" : "rose"}
    />
  );

  return (
    <div
      className={cn(
        "grid grid-cols-2",
        privateBank ? "gap-2.5 sm:gap-3" : "gap-2",
        centered && "mx-auto max-w-md",
        className
      )}
    >
      {showLinks ? (
        <Link
          href="/agent/followers"
          className={cn(
            "group block outline-none",
            privateBank
              ? "rounded-[22px] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-[#D4AF37]/35"
              : "rounded-xl transition-transform duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-gold/40 active:scale-[0.98]"
          )}
          aria-label={`${followers} ${followers === 1 ? "follower" : "followers"}`}
        >
          {followersCard}
        </Link>
      ) : (
        followersCard
      )}

      {showLinks ? (
        <Link
          href="/agent/likes"
          className={cn(
            "group block outline-none",
            privateBank
              ? "rounded-[22px] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-[#D4AF37]/35"
              : "rounded-xl transition-transform duration-150 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-gold/40 active:scale-[0.98]"
          )}
          aria-label={`${likes} ${likes === 1 ? "listing like" : "listing likes"}`}
        >
          {likesCard}
        </Link>
      ) : (
        likesCard
      )}
    </div>
  );
}

function ExecutiveStat({
  icon: Icon,
  value,
  label,
  accent,
  divider,
  valueAsLabel,
}: {
  icon: typeof Users;
  value: string;
  label: string;
  accent: "gold" | "rose";
  divider?: boolean;
  /** When true, primary line is the level word (BASIC) and label sits above */
  valueAsLabel?: boolean;
}) {
  const isRose = accent === "rose";
  const accentColor = isRose ? "text-gold-light" : "text-gold";
  const barColor = isRose ? "bg-gold-light" : "bg-gold";
  const iconColor = isRose ? "text-gold-light" : "text-gold";

  return (
    <div
      className={cn(
        "relative flex min-h-[4.5rem] flex-col items-start justify-center gap-2 px-2.5 py-3.5 sm:min-h-[5rem] sm:px-3.5 sm:py-4",
        divider && "border-l border-gold/20"
      )}
    >
      <div className="flex w-full items-center gap-2 sm:gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border sm:h-9 sm:w-9",
            "border-gold/30 bg-navy/60",
            iconColor
          )}
        >
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          {valueAsLabel ? (
            <>
              <p className="text-[7.5px] font-semibold uppercase leading-tight tracking-[0.08em] text-white/55 sm:text-[9px] sm:tracking-[0.1em]">
                {label}
              </p>
              <p
                className={cn(
                  "mt-0.5 truncate font-[family-name:var(--font-display)] text-sm font-extrabold tracking-wide text-white sm:text-base"
                )}
              >
                {value}
              </p>
            </>
          ) : (
            <>
              <p className="font-[family-name:var(--font-display)] text-lg font-extrabold leading-none tracking-tight text-white tabular-nums sm:text-xl">
                {value}
              </p>
              <p
                className={cn(
                  "mt-1 text-[7.5px] font-semibold uppercase leading-tight tracking-[0.06em] sm:text-[9px] sm:tracking-[0.08em]",
                  accentColor
                )}
              >
                {label}
              </p>
            </>
          )}
        </div>
      </div>
      <span
        className={cn("mt-auto h-0.5 w-7 rounded-full sm:w-8", barColor)}
        aria-hidden
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Users;
  value: number;
  label: string;
  tone: "sky" | "rose" | "private";
}) {
  if (tone === "private") {
    return (
      <div
        className={cn(
          "flex min-h-[3.75rem] items-center gap-3 rounded-[22px] border border-[rgba(212,175,55,0.18)]",
          "bg-[linear-gradient(165deg,rgba(255,253,249,0.95)_0%,rgba(250,246,238,0.82)_100%)]",
          "p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)] backdrop-blur-sm",
          "transition-[transform,box-shadow] duration-200 ease-out",
          "group-hover:-translate-y-px group-hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]",
          "sm:gap-3.5 sm:p-3.5"
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(212,175,55,0.22)] bg-[#FFFDF9]/80 text-[#D4AF37] sm:h-10 sm:w-10">
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-display)] text-lg font-extrabold leading-none tracking-tight text-[#0F172A] tabular-nums sm:text-xl">
            {value}
          </p>
          <p className="mt-1.5 truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
            {label}
          </p>
        </div>
      </div>
    );
  }

  const tones = {
    sky: {
      card: "border-sky-500/20 bg-gradient-to-br from-sky-500/[0.12] via-sky-500/[0.05] to-white",
      icon: "bg-sky-500/15 text-sky-700",
      label: "text-sky-800/65",
    },
    rose: {
      card: "border-rose-500/20 bg-gradient-to-br from-rose-500/[0.12] via-rose-500/[0.05] to-white",
      icon: "bg-rose-500/15 text-rose-700",
      label: "text-rose-800/65",
    },
  } as const;

  const t = tones[tone];

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border p-2.5 shadow-sm transition-shadow duration-150 group-hover:shadow-float sm:gap-3 sm:p-3",
        "min-h-[3.5rem]",
        t.card
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9",
          t.icon
        )}
      >
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-[family-name:var(--font-display)] text-lg font-extrabold leading-none tracking-tight text-navy tabular-nums sm:text-xl">
          {value}
        </p>
        <p
          className={cn(
            "mt-1 truncate text-[10px] font-bold uppercase tracking-[0.05em]",
            t.label
          )}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
