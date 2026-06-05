import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <Logo href="/" showText size={64} />
      <h1 className="mt-6 text-xl font-bold text-navy">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Check your connection and try again. Saved pages may still open from cache.
      </p>
      <Link
        href="/"
        className="btn-accent mt-8 inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold"
      >
        Back home
      </Link>
    </div>
  );
}
