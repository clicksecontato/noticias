export interface TablePolicy {
  table: string;
  requiredColumns: string[];
  requiredIndexes: string[];
  requiredConstraints: string[];
}

export function getSchemaPolicies(): TablePolicy[] {
  return [
    {
      table: "games",
      requiredColumns: ["id", "slug", "name", "release_date"],
      requiredIndexes: [
        "games_slug_unique_idx",
        "games_release_date_idx",
        "games_search_vector_idx"
      ],
      requiredConstraints: ["games_pk", "games_slug_unique"]
    },
    {
      table: "genres",
      requiredColumns: ["id", "slug", "name"],
      requiredIndexes: ["genres_slug_unique_idx"],
      requiredConstraints: ["genres_pk", "genres_slug_unique"]
    },
    {
      table: "platforms",
      requiredColumns: ["id", "slug", "name"],
      requiredIndexes: ["platforms_slug_unique_idx"],
      requiredConstraints: ["platforms_pk", "platforms_slug_unique"]
    },
    {
      table: "tags",
      requiredColumns: ["id", "slug", "name"],
      requiredIndexes: ["tags_slug_unique_idx"],
      requiredConstraints: ["tags_pk", "tags_slug_unique"]
    },
    {
      table: "game_tags",
      requiredColumns: ["game_id", "tag_id"],
      requiredIndexes: ["game_tags_pk_idx"],
      requiredConstraints: ["game_tags_pk"]
    },
    {
      table: "articles",
      requiredColumns: ["id", "slug", "title", "published_at", "status"],
      requiredIndexes: ["articles_slug_unique_idx", "articles_published_at_idx"],
      requiredConstraints: [
        "articles_pk",
        "articles_slug_unique",
        "articles_status_check"
      ]
    },
    {
      table: "sources",
      requiredColumns: ["id", "name", "base_url", "is_active"],
      requiredIndexes: ["sources_base_url_unique_idx"],
      requiredConstraints: ["sources_pk", "sources_base_url_unique"]
    },
    {
      table: "article_sources",
      requiredColumns: ["article_id", "source_id", "source_url"],
      requiredIndexes: ["article_sources_pk_idx"],
      requiredConstraints: ["article_sources_pk"]
    },
    {
      table: "seo_pages",
      requiredColumns: ["id", "page_type", "slug_path", "status"],
      requiredIndexes: ["seo_pages_slug_path_unique_idx"],
      requiredConstraints: ["seo_pages_pk", "seo_pages_slug_path_unique"]
    }
  ];
}
