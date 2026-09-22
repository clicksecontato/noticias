/**
 * Fontes RSS de notícias de tecnologia / IA (pt-BR) para ingestão.
 * A ingestão atual só aceita language pt-BR/pt — priorize feeds em português.
 *
 * base_url: URL do portal/seção (sem barra final).
 * rss_url: URL do feed RSS.
 * Ajuste manualmente se algum feed retornar 404 ou formato inválido.
 */
export const SOURCES_TO_ADD = [
  {
    id: "canaltech-ia",
    name: "Canaltech IA",
    base_url: "https://canaltech.com.br/inteligencia-artificial",
    rss_url: "https://canaltech.com.br/rss/inteligencia-artificial/",
    language: "pt-BR",
  },
  {
    id: "tecnoblog",
    name: "Tecnoblog",
    base_url: "https://tecnoblog.net",
    rss_url: "https://tecnoblog.net/feed/",
    language: "pt-BR",
  },
  {
    id: "tecmundo",
    name: "TecMundo",
    base_url: "https://www.tecmundo.com.br",
    rss_url: "https://rss.tecmundo.com.br/feed",
    language: "pt-BR",
  },
  {
    id: "olhar-digital",
    name: "Olhar Digital",
    base_url: "https://olhardigital.com.br",
    rss_url: "https://olhardigital.com.br/feed/",
    language: "pt-BR",
  },
  {
    id: "showmetech",
    name: "Showmetech",
    base_url: "https://www.showmetech.com.br",
    rss_url: "https://www.showmetech.com.br/feed/",
    language: "pt-BR",
  },
  {
    id: "canaltech",
    name: "Canaltech",
    base_url: "https://canaltech.com.br",
    rss_url: "https://canaltech.com.br/rss/",
    language: "pt-BR",
  },
  {
    id: "macmagazine",
    name: "MacMagazine",
    base_url: "https://macmagazine.com.br",
    rss_url: "https://macmagazine.com.br/feed/",
    language: "pt-BR",
  },
];
