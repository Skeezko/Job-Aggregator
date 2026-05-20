"use client";

import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary:
    "bg-blue-600 hover:bg-blue-500 text-white disabled:bg-blue-600/40",
  secondary:
    "border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white bg-transparent disabled:opacity-40",
  ghost:
    "text-zinc-400 hover:text-white hover:bg-zinc-800 bg-transparent disabled:opacity-40",
  danger:
    "bg-red-600/80 hover:bg-red-600 text-white disabled:opacity-40",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-4 py-2 text-sm rounded-md",
  lg: "px-6 py-3 text-sm rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span
            className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
