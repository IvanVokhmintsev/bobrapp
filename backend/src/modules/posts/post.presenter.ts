type PostWithAuthor = {
  id: string;
  text: string;
  type: "professional" | "roadmap";
  likesCount: number;
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
};

export function toPublicPost(post: PostWithAuthor, currentUserId?: string) {
  const likedByMe =
    currentUserId !== undefined
      ? (post.postLikes ?? []).some((like) => like.userId === currentUserId)
      : false;

  return {
    id: post.id,
    text: post.text,
    type: post.type,
    likesCount: post.likesCount,
    likedByMe,
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
