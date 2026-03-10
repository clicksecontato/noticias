export interface InternalLinkCandidate {
  slugPath: string;
  pageType: "game" | "genre" | "platform" | "news" | "collection";
  genres?: string[];
  platforms?: string[];
  tags?: string[];
}

export interface InternalLink {
  from: string;
  to: string;
  score: number;
  reason: "shared_genre" | "shared_platform" | "shared_tag" | "same_cluster";
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
      const sharedGenres = intersectionCount(origin.genres, candidate.genres);
      const sharedPlatforms = intersectionCount(origin.platforms, candidate.platforms);
      const sharedTags = intersectionCount(origin.tags, candidate.tags);

      const score = sharedGenres * 10 + sharedPlatforms * 5 + sharedTags * 3;
      let reason: InternalLink["reason"] = "same_cluster";

      if (sharedGenres > 0) {
        reason = "shared_genre";
      } else if (sharedPlatforms > 0) {
        reason = "shared_platform";
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
