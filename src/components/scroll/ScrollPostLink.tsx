import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { ScrollPost } from "@/lib/scroll";

export function ScrollPostLink({
  post,
  className,
  children,
}: {
  post: ScrollPost;
  className?: string;
  children: ReactNode;
}) {
  if (post.externalUrl) {
    return <a href={post.externalUrl} className={className}>{children}</a>;
  }

  return (
    <Link to="/scroll/$slug" params={{ slug: post.slug }} className={className}>
      {children}
    </Link>
  );
}
