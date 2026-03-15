import { ReportsClient } from "./ReportsClient";

export const metadata = {
  title: "Relatórios",
  description:
    "Relatórios sobre publicações de games: volume por período, ranking de fontes e mais."
};

export default function ReportsPage() {
  return <ReportsClient />;
}
