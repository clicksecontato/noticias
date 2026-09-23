export interface TablePolicy {
  table: string;
  requiredColumns: string[];
  requiredIndexes: string[];
  requiredConstraints: string[];
}

export function getSchemaPolicies(): TablePolicy[] {
  return [
    {
      table: "subjects",
      requiredColumns: ["id", "slug", "name", "release_date"],
      requiredIndexes: [
        "subjects_slug_unique_idx",
        "subjects_release_date_idx",
        "subjects_search_vector_idx"
      ],
      requiredConstraints: ["subjects_pk", "subjects_slug_unique"]
    },
    {
      table: "types",
      requiredColumns: ["id", "slug", "name"],
      requiredIndexes: ["types_slug_unique_idx"],
      requiredConstraints: ["types_pk", "types_slug_unique"]
    },
    {
      table: "tags",
      requiredColumns: ["id", "slug", "name"],
      requiredIndexes: ["tags_slug_unique_idx"],
      requiredConstraints: ["tags_pk", "tags_slug_unique"]
    },
    {
      table: "subject_tags",
      requiredColumns: ["subject_id", "tag_id"],
      requiredIndexes: ["subject_tags_pk_idx"],
      requiredConstraints: ["subject_tags_pk"]
    },
    {
      table: "articles",
      requiredColumns: ["id", "slug", "title", "published_at", "status", "is_news"],
      requiredIndexes: ["articles_slug_unique_idx", "articles_published_at_idx"],
      requiredConstraints: [
        "articles_pk",
        "articles_slug_unique",
        "articles_status_check"
      ]
    },
    {
      table: "sources",
      requiredColumns: [
        "id",
        "name",
        "base_url",
        "is_active",
        "last_ingested_at",
        "last_ingestion_duration_ms"
      ],
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
