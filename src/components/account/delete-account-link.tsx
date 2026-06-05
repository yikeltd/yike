import Link from "next/link";
import { Trash2 } from "lucide-react";

export function DeleteAccountLink() {
  return (
    <Link
      href="/account/delete"
      className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-danger transition-colors hover:bg-danger/10"
    >
      <Trash2 className="h-5 w-5 shrink-0" />
      <span>
        <span className="block font-medium">Delete account</span>
        <span className="text-xs opacity-80">Permanently remove your data</span>
      </span>
    </Link>
  );
}
