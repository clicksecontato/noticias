export interface YoutubeChannelRef {
  name: string;
  provider?: string | null;
  isActive?: boolean;
  channelId?: string | null;
  /** @ do canal, customUrl da API ou URL youtube.com/@nome. */
  handle?: string | null;
}

/** Extrai o nome do @, sem o prefixo. Id UC… não vira handle. */
export function youtubeHandleName(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const fromUrl = raw.match(/youtube\.com\/@([^/?#]+)/i);
  let handle = fromUrl?.[1] ?? raw;
  if (handle.startsWith("@")) handle = handle.slice(1);
  handle = handle.trim();
  if (!handle || handle.startsWith("UC") || /[\s/]/.test(handle)) return null;
  return handle;
}

export function youtubeAtUrl(handle: string): string {
  return `https://www.youtube.com/@${handle}`;
}

/** Uma URL https://www.youtube.com/@canal por linha, só canais ativos, em ordem de nome. */
export function activeYoutubeChannelUrls(sources: YoutubeChannelRef[]): string {
  return sources
    .filter((source) => source.provider === "youtube" && source.isActive === true)
    .map((source) => {
      const handle = youtubeHandleName(source.handle) ?? youtubeHandleName(source.channelId);
      if (!handle) return null;
      return { name: source.name, url: youtubeAtUrl(handle) };
    })
    .filter((row): row is { name: string; url: string } => row != null)
    .sort((a, b) => a.name.localeCompare(b.name, "pt"))
    .map((row) => row.url)
    .join("\n");
}

type ChannelsHandleResponse = {
  items?: Array<{
    id?: string;
    snippet?: { customUrl?: string };
  }>;
  error?: { message?: string };
};

/** customUrl (@nome) de vários canais. channels.list aceita até 50 ids por chamada (1 unidade). */
export async function fetchYoutubeHandleByChannelId(
  apiKey: string,
  channelIds: string[],
  fetchImpl: typeof fetch = fetch
): Promise<Map<string, string>> {
  const { recordYoutubeApiCall } = await import("./youtube-api-quota-repository");
  const handles = new Map<string, string>();
  const ids = [...new Set(channelIds.map((id) => id.trim()).filter((id) => id.startsWith("UC") && id.length >= 24))];
  for (let index = 0; index < ids.length; index += 50) {
    const batch = ids.slice(index, index + 50);
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("id", batch.join(","));
    url.searchParams.set("key", apiKey);
    void recordYoutubeApiCall("channels.list", `handles:${batch.length}`);
    const response = await fetchImpl(url.toString());
    const data = (await response.json()) as ChannelsHandleResponse;
    if (!response.ok) {
      throw new Error(data.error?.message || `YouTube API HTTP ${response.status}`);
    }
    for (const item of data.items ?? []) {
      const handle = youtubeHandleName(item.snippet?.customUrl);
      if (item.id && handle) handles.set(item.id, handle);
    }
  }
  return handles;
}
