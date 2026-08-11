import { headers } from "next/headers";
import { getPosts } from "@/lib/data-service";
import LokPostGallery from "./LokPostGallery";

export const revalidate = 120; // ISR: regenerate every 2 minutes, on-demand via /api/revalidate

export const metadata = {
  title: "Lok Post — People & Leaders | LoktantraVani",
  description:
    "Profiles of the people, personalities, and leaders shaping Bharat — from the courtroom and Parliament to the policy room and the movements behind them.",
};

export default async function LokPostPage() {
  const headersList = await headers();
  const isHindi = headersList.get("x-lang") === "hi";

  const all = isHindi
    ? await getPosts("published", 200, "hi")
    : await getPosts("published", 200, "en");
  const posts = all.filter((p) => p.category === "Lok Post");

  return <LokPostGallery posts={posts} />;
}
