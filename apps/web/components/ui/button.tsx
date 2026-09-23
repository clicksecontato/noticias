import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center",
    "rounded-2xl border text-sm font-semibold whitespace-nowrap",
    "transition-all duration-200 outline-none select-none",
    "focus-visible:ring-3 focus-visible:ring-ring/35",
    "active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "overflow-hidden border-transparent text-[#1a1410]",
          "bg-[linear-gradient(145deg,#e8c49a_0%,#d4a574_48%,#a67c52_100%)]",
          "bg-clip-padding",
          "shadow-[0_6px_20px_rgba(212,165,116,0.35)]",
          "hover:bg-[linear-gradient(145deg,#f0d4a8_0%,#e8c49a_42%,#d4a574_100%)]",
          "hover:shadow-[0_8px_24px_rgba(212,165,116,0.45)]",
          "hover:-translate-y-px",
        ].join(" "),
        outline: [
          "border border-white/15 bg-transparent text-foreground",
          "hover:border-transparent hover:text-[#1a1410]",
          "hover:bg-[linear-gradient(145deg,#e8c49a_0%,#d4a574_55%,#a67c52_100%)]",
          "hover:shadow-[0_6px_18px_rgba(212,165,116,0.3)]",
        ].join(" "),
        secondary: [
          "border border-white/10 bg-secondary text-secondary-foreground",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
          "hover:bg-muted hover:border-white/15",
        ].join(" "),
        ghost:
          "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground",
        destructive: [
          "overflow-hidden border-transparent text-white",
          "bg-[linear-gradient(145deg,#ff6b6b_0%,#ff4d4d_55%,#dc2626_100%)]",
          "shadow-[0_4px_14px_rgba(255,77,77,0.3)]",
          "hover:brightness-110",
        ].join(" "),
        link: "border-transparent rounded-md text-primary underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default:
          "h-10 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-8 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-7 text-base",
        icon: "size-10",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
