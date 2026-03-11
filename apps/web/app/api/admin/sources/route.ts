import { createContentRepository } from "../../../../../../packages/database/src/content-repository";

export async function GET(): Promise<Response> {
  const repository = createContentRepository();
  const sources = await repository.getActivePortugueseSources();
  const sourceIds = sources.map((s) => s.id);
  return Response.json({ sourceIds });
}
