import { ReportsClient } from "../../reports/ReportsClient";

export const metadata = {
  title: "Relatórios",
  description:
    "Relatórios sobre publicações de games: volume por período, ranking de fontes e mais.",
};

export default function AdminReportsPage() {
  return <ReportsClient />;
}

