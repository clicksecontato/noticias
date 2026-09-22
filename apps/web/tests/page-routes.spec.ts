import { describe, expect, it } from "vitest";
import {
  generateMetadata as generateSubjectMetadata,
  generateStaticParams as generateSubjectStaticParams,
  revalidate as subjectRevalidate
} from "../app/subjects/[slug]/page";
import {
  generateMetadata as generateNewsMetadata,
  generateStaticParams as generateNewsStaticParams,
  revalidate as newsRevalidate
} from "../app/news/[slug]/page";
import {
  generateMetadata as generateSubjectsLikeMetadata,
  generateStaticParams as generateSubjectsLikeStaticParams,
  revalidate as subjectsLikeRevalidate
} from "../app/subjects-like/[slug]/page";
import {
  generateMetadata as generateBestTypeMetadata,
  generateStaticParams as generateBestTypeStaticParams,
  revalidate as bestTypeRevalidate
} from "../app/best/[type]/page";

describe("Web Application Agent - route modules", () => {
  it("deve expor revalidate por tipo de pagina", () => {
    expect(newsRevalidate).toBe(900);
    expect(subjectRevalidate).toBe(86400);
    expect(subjectsLikeRevalidate).toBe(86400);
    expect(bestTypeRevalidate).toBe(43200);
  });

  it("deve expor generateStaticParams para todas as rotas", async () => {
    const newsParams = await generateNewsStaticParams();
    const subjectParams = await generateSubjectStaticParams();
    const subjectsLikeParams = await generateSubjectsLikeStaticParams();
    const bestTypeParams = await generateBestTypeStaticParams();

    expect(newsParams.length).toBeGreaterThan(0);
    expect(subjectParams.length).toBeGreaterThan(0);
    expect(subjectsLikeParams.length).toBeGreaterThan(0);
    expect(bestTypeParams.length).toBeGreaterThan(0);
    expect(newsParams[0]).toHaveProperty("slug");
    expect(subjectParams[0]).toHaveProperty("slug");
    expect(subjectsLikeParams[0]).toHaveProperty("slug");
    expect(bestTypeParams[0]).toHaveProperty("type");
  });

  it("deve gerar metadata com canonical coerente por rota", async () => {
    const news = await generateNewsMetadata({
      params: Promise.resolve({ slug: "openai-lanca-atualizacao-chatgpt" })
    });
    const subject = await generateSubjectMetadata({
      params: Promise.resolve({ slug: "chatgpt" })
    });
    const subjectsLike = await generateSubjectsLikeMetadata({
      params: Promise.resolve({ slug: "chatgpt" })
    });
    const bestType = await generateBestTypeMetadata({
      params: Promise.resolve({ type: "llm" })
    });

    expect(news.alternates.canonical).toContain("/news/openai-lanca-atualizacao-chatgpt");
    expect(subject.alternates.canonical).toContain("/subjects/chatgpt");
    expect(subjectsLike.alternates.canonical).toContain("/subjects-like/chatgpt");
    expect(bestType.alternates.canonical).toContain("/best/llm");
  });
});
