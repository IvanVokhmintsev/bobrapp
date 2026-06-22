import type { ApiPost } from "../../api";

export type FeedPostMedia = {
  imageUrl: string | null;
  audioUrl: string | null;
};

export type FeedPostDisplayMode = "demo" | "text" | "roadmap";

export function getPostDisplayMode(
  post: ApiPost,
  media?: FeedPostMedia,
): FeedPostDisplayMode {
  if (post.type === "roadmap") {
    return "roadmap";
  }

  if (media?.imageUrl || media?.audioUrl) {
    return "demo";
  }

  if (post.text.trim()) {
    return "text";
  }

  return "demo";
}

export function revokeObjectUrl(url: string | null | undefined) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
