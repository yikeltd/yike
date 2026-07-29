import Link from "next/link";
import { FileQuestion, ArrowLeft, Shield } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto max-w-md space-y-5 rounded-3xl border border-navy/10 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
          <FileQuestion className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black tracking-tight text-navy">
            Admin Module Not Found
          </h1>
          <p className="text-xs font-medium text-navy/70 leading-relaxed">
            The requested admin page or resource could not be found or has been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/lex/auth/overview"
            className="pressable flex w-full items-center justify-center gap-2 rounded-2xl bg-[#031B4E] px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-navy-light"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Admin Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
