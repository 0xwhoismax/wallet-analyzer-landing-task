"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/utils";
import { useState } from "react";
import { Clipboard, Check } from "lucide-react";
interface CopyableButtonProps {
  text: string;
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer disabled:cursor-not-allowed transition-[color,background-color,border-color,box-shadow,opacity,translate,scale,filter] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-90 active:brightness-110",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background hover:bg-foreground/90 rounded-full shadow-sm hover:shadow",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30 rounded-full shadow-sm",
        create:
          "bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-sm hover:shadow inner-glow",
        outline:
          "border border-border/80 bg-background/35 hover:bg-background/70 hover:text-foreground rounded-full",
        bevel:
          "relative bg-background rounded-full border border-border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:bg-muted/60 hover:border-border transition-colors",
        pill:
          "border border-border/80 bg-background/35 hover:bg-background/70 hover:text-foreground rounded-full",
        secondary:
          "bg-muted/60 text-secondary-foreground hover:bg-muted rounded-full",
        flat: "bg-transparent hover:bg-primary/10 hover:text-foreground",
        ghost: "hover:bg-primary/10 hover:text-foreground rounded-full",
        link: "text-primary underline-offset-4 hover:underline",
        cta:
          "border border-border bg-card hover:bg-primary/8 hover:border-primary/30 rounded-full shadow-sm",
        inverse:
          "bg-muted text-foreground border border-border hover:bg-muted/80 rounded-full shadow-sm",
      },
      size: {
        default: "h-8 px-3 has-[>svg]:px-2",
        sm: "h-7 gap-1.5 px-2.5 has-[>svg]:px-2",
        lg: "h-9 px-4 has-[>svg]:px-3",
        xl: "h-10 px-6 has-[>svg]:px-4",
        socialData: "h-6 rounded-full p-1",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
// NEW
function CopyableButton({ text }: CopyableButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy}>
      {copied ? (
        <Check className="size-4 text-green-500" />
      ) : (
        <Clipboard className="size-4" />
      )}
    </Button>
  );
}

export { Button, buttonVariants, CopyableButton };
