import { Suspense } from "react";
import { NoticiasClient } from "./NoticiasClient";

export default function AdminNoticiasPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
      <NoticiasClient />
    </Suspense>
  );
}
