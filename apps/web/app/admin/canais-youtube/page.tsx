import { CanaisYoutubeUrlsClient } from "./CanaisYoutubeUrlsClient";

export const metadata = {
  title: "URLs dos canais",
  description: "Copia as URLs dos canais YouTube ativos.",
};

export default function CanaisYoutubePage() {
  return <CanaisYoutubeUrlsClient />;
}
