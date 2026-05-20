type PostWithAuthor = {
  id: string;
  text: string;
  type: "professional" | "roadmap";
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
    } | null;
  };
  postLikes?: Array<{
    userId: string;
  }>;
  reposts?: Array<{
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

  return {
    id: post.id,
    text: post.text,
    type: post.type,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    repostsCount: post.repostsCount,
    likedByMe,
    repostedByMe,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    author: {
      id: post.author.id,
      name: post.author.name,
      role: post.author.role,
      avatarUrl: post.author.musicianProfile?.avatarUrl ?? null,
    },
  };
}
