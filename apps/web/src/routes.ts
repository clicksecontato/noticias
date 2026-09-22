export interface WebRouteInput {
  type: "news" | "subject" | "subjects-like" | "best-type";
  slug?: string;
  /** Slug do tipo para rotas /best/[type] */
  typeSlug?: string;
}

function requireParam(value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error("Missing required route parameter");
  }
  return value.trim();
}

export function buildRoutePath(input: WebRouteInput): string {
  if (input.type === "news") {
    return `/news/${requireParam(input.slug)}`;
  }

  if (input.type === "subject") {
    return `/subjects/${requireParam(input.slug)}`;
  }

  if (input.type === "subjects-like") {
    return `/subjects-like/${requireParam(input.slug)}`;
  }

  return `/best/${requireParam(input.typeSlug)}`;
}
