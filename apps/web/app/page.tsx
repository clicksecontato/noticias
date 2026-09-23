import { redirect } from "next/navigation";

/** Hub operacional: ferramenta pessoal → admin. */
export default function HomePage() {
  redirect("/admin");
}
