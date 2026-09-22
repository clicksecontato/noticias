import {
  buildRevalidateTags,
  type RevalidateTagInput
} from "./publishing";

export interface PublicationEvent {
  entity: "news" | "subject" | "type-page";
  slug?: string;
  type?: string;
}

export interface RevalidationPlan {
  tags: string[];
  paths: string[];
}

function toTagInput(event: PublicationEvent): RevalidateTagInput {
  if (event.entity === "news") {
    return { pageType: "news", slug: event.slug };
  }

  if (event.entity === "subject") {
    return { pageType: "subject", slug: event.slug, type: event.type };
  }

  return { pageType: "best", type: event.type };
}

function getPathList(event: PublicationEvent): string[] {
  if (event.entity === "news" && event.slug) {
    return [`/news/${event.slug}`];
  }

  if (event.entity === "subject" && event.slug) {
    return [`/subjects/${event.slug}`, `/subjects-like/${event.slug}`];
  }

  if (event.entity === "type-page" && event.type) {
    return [`/best/${event.type}`];
  }

  return [];
}

export function planRevalidationForPublication(
  event: PublicationEvent
): RevalidationPlan {
  const tagInput = toTagInput(event);
  const tags = buildRevalidateTags(tagInput);
  const paths = getPathList(event);

  return {
    tags,
    paths
  };
}
