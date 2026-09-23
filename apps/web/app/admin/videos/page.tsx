import { Suspense } from "react";
import { VideosClient } from "./VideosClient";

export default function AdminVideosPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
      <VideosClient />
    </Suspense>
  );
}
