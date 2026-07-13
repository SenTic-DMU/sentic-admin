import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" && "bg-slate-900 text-white hover:bg-slate-700",
          variant === "outline" &&
            "border border-slate-300 bg-white hover:bg-slate-100",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
