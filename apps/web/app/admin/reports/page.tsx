import { Suspense } from "react";
import { ReportsClient } from "../../reports/ReportsClient";

export const metadata = {
  title: "Relatórios",
  description:
    "Relatórios do acervo: volume, fontes, radar de pauta, mapa temático e mais.",
};

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
      <ReportsClient />
    </Suspense>
  );
}
