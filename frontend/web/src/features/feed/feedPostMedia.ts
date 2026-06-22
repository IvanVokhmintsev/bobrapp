import type { ApiPost } from "../../api";

export type FeedPostDisplayMode = "demo" | "text" | "roadmap";

export function getPostDisplayMode(post: ApiPost): FeedPostDisplayMode {
  if (post.type === "roadmap") {
    return "roadmap";
  }

  if (post.imageUrl || post.audioUrl) {
    return "demo";
  }

  if (post.text.trim()) {
    return "text";
  }

  return "demo";
}
