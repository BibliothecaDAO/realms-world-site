import { createFileRoute, notFound } from "@tanstack/react-router";
import { HistoryOfLostWorlds } from "@/components/lore/HistoryOfLostWorlds";
import { generateMetaTags } from "@/lib/og-image";
import { getScrollPostBySlug } from "@/lib/scroll";

const canonicalUrl = "https://realms.world/scroll/history-of-lost-worlds";

export const Route = createFileRoute("/scroll/history-of-lost-worlds")({
  loader: () => {
    const post = getScrollPostBySlug("history-of-lost-worlds");
    if (!post) throw notFound();
    return post;
  },
  component: HistoryOfLostWorlds,
  head: ({ loaderData: post }) => ({
    meta: post
      ? generateMetaTags({
          title: `${post.title} - Realms World`,
          description: post.excerpt,
          image: post.coverImage,
          path: "/scroll/history-of-lost-worlds",
          url: canonicalUrl,
          type: "article",
        })
      : [],
    links: [{ rel: "canonical", href: canonicalUrl }],
  }),
});
