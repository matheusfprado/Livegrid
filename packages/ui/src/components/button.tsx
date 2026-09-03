import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#5865f2] text-white hover:bg-[#4752c4]",
        destructive: "bg-[#da373c] text-white hover:bg-[#a12828]",
        outline: "border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800",
        secondary: "bg-[#313338] text-zinc-100 hover:bg-[#404249]",
        ghost: "text-zinc-200 hover:bg-[#35373c] hover:text-white",
        link: "min-h-0 px-0 text-[#00a8fc] underline-offset-4 hover:underline",
        primary: "bg-[#5865f2] text-white hover:bg-[#4752c4]",
        danger: "bg-[#da373c] text-white hover:bg-[#a12828]",
      },
      size: {
        default: "px-4 py-2",
        sm: "min-h-9 px-3",
        lg: "min-h-12 px-6",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ asChild = false, className, size, type = "button", variant, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ className, size, variant }))}
      type={type}
      {...props}
    />
  );
}

export { buttonVariants };
