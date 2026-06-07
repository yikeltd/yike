"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  revealLabel?: string;
};

export function PasswordInput({
  label,
  revealLabel = "password",
  className,
  id: idProp,
  ...props
}: Props) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        id={id}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:text-foreground"
        aria-label={visible ? `Hide ${revealLabel}` : `Show ${revealLabel}`}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden />
        ) : (
          <Eye className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
