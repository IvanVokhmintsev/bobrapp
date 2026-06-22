type PostWithAuthor = {
  id: string;
  text: string;
  type: "professional" | "roadmap";
  imageUrl: string | null;
  audioUrl: string | null;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    role: "musician" | "label";
    musicianProfile?: {
      avatarUrl: string | null;
      profileType?: "solo" | "band";
    } | null;
  };
  postLikes?: Array<{
    userId: string;
  }>;
  reposts?: Array<{
    userId: string;
  }>;
  favoritePosts?: Array<{
    userId: string;
  }>;
};

export function toPublicPost(post: PostWithAuthor, currentUserId?: string) {
  const likedByMe =
    currentUserId !== undefined
      ? (post.postLikes ?? []).some((like) => like.userId === currentUserId)
      : false;
  const repostedByMe =
    currentUserId !== undefined
      ? (post.reposts ?? []).some((repost) => repost.userId === currentUserId)
      : false;
  const favoritedByMe =
    currentUserId !== undefined
      ? (post.favoritePosts ?? []).some((favorite) => favorite.userId === currentUserId)
      : false;

  return {
    id: post.id,
    text: post.text,
    type: post.type,
    imageUrl: post.imageUrl,
    audioUrl: post.audioUrl,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    repostsCount: post.repostsCount,
    likedByMe,
    repostedByMe,
    favoritedByMe,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    author: {
      id: post.author.id,
      name: post.author.name,
      role: post.author.role,
      avatarUrl: post.author.musicianProfile?.avatarUrl ?? null,
      profileType: post.author.musicianProfile?.profileType ?? "solo",
    },
  };
}
