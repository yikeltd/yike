import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "yike-focus h-12 w-full rounded-xl border border-transparent bg-surface px-4 text-sm outline-none transition-all placeholder:text-muted",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "yike-focus h-12 w-full appearance-none rounded-xl border border-transparent bg-surface px-4 text-sm font-medium outline-none transition-all",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "yike-focus min-h-[100px] w-full rounded-xl border border-transparent bg-surface px-4 py-3 text-sm outline-none transition-all placeholder:text-muted",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
