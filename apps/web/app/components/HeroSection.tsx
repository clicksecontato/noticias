import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface HeroSectionProps {
  eyebrow?: string;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  className?: string;
}

export function HeroSection({
  eyebrow = "Portal em português brasileiro",
  title,
  description,
  ctaHref,
  ctaLabel,
  className,
}: HeroSectionProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        {eyebrow ? (
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
        ) : null}
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Link href={ctaHref} className={buttonVariants({ size: "lg" })}>
          {ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
