import Link from "next/link";
import { Heart } from "lucide-react";

export function SavedEmptyLoggedIn() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-surface bg-elevated px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15">
        <Heart className="h-7 w-7 text-gold-dark dark:text-gold" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-foreground">
        Start saving homes you love
      </h2>
      <p className="mt-2 max-w-xs text-sm text-muted">
        Tap the heart on any listing to keep it here.
      </p>
      <Link
        href="/browse"
        className="pressable mt-6 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-navy"
      >
        Browse Homes
      </Link>
    </div>
  );
}
