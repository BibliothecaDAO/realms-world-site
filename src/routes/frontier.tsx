import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/frontier")({
  beforeLoad: () => {
    throw redirect({
      to: "/games/$slug",
      params: { slug: "frontier" },
      replace: true,
    });
  },
});
