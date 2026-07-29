"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft, ShieldAlert } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[yike:admin-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto max-w-md space-y-5 rounded-3xl border border-amber-200/80 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black tracking-tight text-navy">
            Admin Console Error
          </h1>
          <p className="text-xs font-medium text-navy/70 leading-relaxed">
            An error occurred while loading this admin module. Your session remains secure.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-[#031B4E] px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-navy-light"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Action</span>
          </button>

          <Link
            href="/lex/auth/overview"
            className="pressable flex w-full items-center justify-center gap-2 rounded-2xl border border-navy/10 bg-slate-50 px-4 py-3 text-xs font-bold text-navy hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
