import { createClient } from "@supabase/supabase-js";
import { getDatabaseConfig, type DatabaseConfig } from "./config";

export interface NewsArticleRecord {
  slug: string;
  title: string;
  summary: string;
}

export interface GameRecord {
  slug: string;
  name: string;
  summary: string;
}

export interface GenrePlatformRecord {
  genre: string;
  platform: string;
}

export interface SourceRecord {
  id: string;
  name: string;
  language: "pt-BR" | "pt" | "en-US";
  rssUrl: string;
  isActive: boolean;
}

export interface ContentRepository {
  getNewsArticles(): Promise<NewsArticleRecord[]>;
  getGames(): Promise<GameRecord[]>;
  getBestGenres(): Promise<string[]>;
  getBestGenrePlatformPairs(): Promise<GenrePlatformRecord[]>;
  getHardwareProfiles(): Promise<string[]>;
  getActivePortugueseSources(): Promise<SourceRecord[]>;
}

const NEWS_ARTICLES: NewsArticleRecord[] = [
  {
    slug: "novo-trailer-de-gta-6",
    title: "Novo trailer de GTA 6 revela mais da cidade",
    summary: "Confira os principais detalhes revelados e o que muda na jogabilidade."
  },
  {
    slug: "atualizacao-elden-ring",
    title: "Atualizacao de Elden Ring melhora balanceamento",
    summary: "Patch recente ajusta builds e melhora estabilidade em diferentes plataformas."
  }
];

const GAMES: GameRecord[] = [
  {
    slug: "elden-ring",
    name: "Elden Ring",
    summary: "RPG de acao com exploracao em mundo aberto e combate desafiador."
  },
  {
    slug: "baldurs-gate-3",
    name: "Baldur's Gate 3",
    summary: "RPG tatico com narrativa profunda e escolhas de alto impacto."
  }
];

const BEST_GENRES = ["rpg", "fps", "survival"];

const BEST_GENRE_PLATFORM_PAIRS: GenrePlatformRecord[] = [
  { genre: "rpg", platform: "pc" },
  { genre: "fps", platform: "ps5" },
  { genre: "survival", platform: "xbox-series" }
];

const HARDWARE_PROFILES = ["8gb", "16gb", "32gb"];
const SOURCES: SourceRecord[] = [
  {
    id: "s1",
    name: "The Enemy",
    language: "pt-BR",
    rssUrl: "https://www.theenemy.com.br/rss",
    isActive: true
  },
  {
    id: "s2",
    name: "Canaltech Games",
    language: "pt-BR",
    rssUrl: "https://canaltech.com.br/rss/games/",
    isActive: true
  },
  {
    id: "s3",
    name: "IGN International",
    language: "en-US",
    rssUrl: "https://feeds.ign.com/ign/all",
    isActive: false
  }
];

function createMemoryContentRepository(): ContentRepository {
  return {
    async getNewsArticles() {
      return NEWS_ARTICLES;
    },
    async getGames() {
      return GAMES;
    },
    async getBestGenres() {
      return BEST_GENRES;
    },
    async getBestGenrePlatformPairs() {
      return BEST_GENRE_PLATFORM_PAIRS;
    },
    async getHardwareProfiles() {
      return HARDWARE_PROFILES;
    },
    async getActivePortugueseSources() {
      return SOURCES.filter(
        (source) =>
          source.isActive && (source.language === "pt-BR" || source.language === "pt")
      );
    }
  };
}

function createSupabaseContentRepository(config: DatabaseConfig): ContentRepository {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required");
  }

  const client = createClient(config.supabaseUrl, config.supabaseAnonKey);

  return {
    async getNewsArticles() {
      const { data, error } = await client
        .from("articles")
        .select("slug,title,excerpt")
        .order("published_at", { ascending: false })
        .limit(200);

      if (error) {
        throw new Error(`Failed to fetch news articles: ${error.message}`);
      }

      return (data || []).map((row) => ({
        slug: row.slug,
        title: row.title,
        summary: row.excerpt || row.title
      }));
    },
    async getGames() {
      const { data, error } = await client
        .from("games")
        .select("slug,name,summary")
        .order("updated_at", { ascending: false })
        .limit(500);

      if (error) {
        throw new Error(`Failed to fetch games: ${error.message}`);
      }

      return (data || []).map((row) => ({
        slug: row.slug,
        name: row.name,
        summary: row.summary || row.name
      }));
    },
    async getBestGenres() {
      const { data, error } = await client.from("genres").select("slug").limit(100);
      if (error) {
        throw new Error(`Failed to fetch genres: ${error.message}`);
      }

      return (data || []).map((row) => row.slug);
    },
    async getBestGenrePlatformPairs() {
      const [genres, platforms] = await Promise.all([
        this.getBestGenres(),
        (async () => {
          const { data, error } = await client.from("platforms").select("slug").limit(10);
          if (error) {
            throw new Error(`Failed to fetch platforms: ${error.message}`);
          }
          return (data || []).map((row) => row.slug);
        })()
      ]);

      const pairs: GenrePlatformRecord[] = [];
      for (const genre of genres.slice(0, 5)) {
        for (const platform of platforms.slice(0, 3)) {
          pairs.push({ genre, platform });
        }
      }

      return pairs;
    },
    async getHardwareProfiles() {
      const { data, error } = await client
        .from("seo_pages")
        .select("slug_path,page_type")
        .eq("page_type", "hardware")
        .limit(100);

      if (error) {
        return HARDWARE_PROFILES;
      }

      const profiles = (data || [])
        .map((row) => row.slug_path.split("/").filter(Boolean).at(-1))
        .filter((value): value is string => Boolean(value));

      return profiles.length > 0 ? profiles : HARDWARE_PROFILES;
    },
    async getActivePortugueseSources() {
      const { data, error } = await client
        .from("sources")
        .select("id,name,language,rss_url,is_active")
        .eq("is_active", true)
        .in("language", ["pt-BR", "pt"])
        .limit(100);

      if (error) {
        throw new Error(`Failed to fetch sources: ${error.message}`);
      }

      return (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        language: row.language,
        rssUrl: row.rss_url,
        isActive: row.is_active
      })) as SourceRecord[];
    }
  };
}

export function getContentSourceFromConfig(config: Pick<DatabaseConfig, "contentSource">) {
  return config.contentSource === "supabase" ? "supabase" : "memory";
}

export function createContentRepository(): ContentRepository {
  const config = getDatabaseConfig();
  const source = getContentSourceFromConfig(config);

  if (source === "supabase") {
    return createSupabaseContentRepository(config);
  }

  return createMemoryContentRepository();
}
