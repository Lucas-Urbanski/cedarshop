"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { authInputClassName } from "@/components/auth/authFields";

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        type={isVisible ? "text" : "password"}
        className={[authInputClassName, "pr-11", className]
          .filter(Boolean)
          .join(" ")}
      />
      <button
        type="button"
        onClick={() => setIsVisible((visible) => !visible)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-taupe transition-colors hover:text-porcelain"
        aria-label={isVisible ? "Hide password" : "Show password"}
      >
        {isVisible ? (
          <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.5} />
        ) : (
          <Eye className="h-[18px] w-[18px]" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
