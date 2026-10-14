import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "link";
export type ButtonSize = "md" | "sm";

const base =
  "group/btn inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "rounded-[2px] bg-accent text-accent-fg hover:brightness-[0.92]",
  secondary:
    "rounded-[2px] border border-current/40 bg-transparent text-current hover:border-current hover:bg-current/5",
  link: "text-current underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-12 px-5 text-[15px]",
  sm: "h-10 px-4 text-sm",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variants[variant], variant !== "link" && sizes[size], className);
}

function Arrow() {
  return (
    <ArrowRight
      aria-hidden
      className="size-4 transition-transform duration-200 group-hover/btn:translate-x-1 motion-reduce:transition-none"
    />
  );
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show a trailing arrow (default for `link`). */
  arrow?: boolean;
};

export function Button({
  variant,
  size,
  arrow,
  className,
  children,
  type = "button",
  ...props
}: CommonProps & React.ComponentPropsWithoutRef<"button">) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...props}>
      {children}
      {(arrow ?? variant === "link") && <Arrow />}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  arrow,
  className,
  children,
  ...props
}: CommonProps & React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {children}
      {(arrow ?? variant === "link") && <Arrow />}
    </Link>
  );
}
