export interface InternalLinkCandidate {
  slugPath: string;
  pageType: "subject" | "type" | "news" | "collection";
  types?: string[];
  tags?: string[];
}

export interface InternalLink {
  from: string;
  to: string;
  score: number;
  reason: "shared_type" | "shared_tag" | "same_cluster";
}

function intersectionCount(left: string[] = [], right: string[] = []): number {
  const rightSet = new Set(right);
  return left.reduce((total, item) => total + (rightSet.has(item) ? 1 : 0), 0);
}

export function suggestInternalLinks(
  origin: InternalLinkCandidate,
  candidates: InternalLinkCandidate[],
  limit = 5
): InternalLink[] {
  const scored = candidates
    .filter((candidate) => candidate.slugPath !== origin.slugPath)
    .map((candidate) => {
      const sharedTypes = intersectionCount(origin.types, candidate.types);
      const sharedTags = intersectionCount(origin.tags, candidate.tags);

      const score = sharedTypes * 10 + sharedTags * 3;
      let reason: InternalLink["reason"] = "same_cluster";

      if (sharedTypes > 0) {
        reason = "shared_type";
      } else if (sharedTags > 0) {
        reason = "shared_tag";
      }

      return {
        from: origin.slugPath,
        to: candidate.slugPath,
        score,
        reason
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
