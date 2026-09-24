import { YoutubeApiQuotaClient } from "./YoutubeApiQuotaClient";

export const metadata = {
  title: "API YouTube",
  description: "Uso estimado e limites da YouTube Data API v3.",
};

export default function AdminYoutubeApiPage() {
  return <YoutubeApiQuotaClient />;
}
