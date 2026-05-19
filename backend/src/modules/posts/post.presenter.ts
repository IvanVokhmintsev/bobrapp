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
};

export function toPublicPost(post: PostWithAuthor) {
  return {
    id: post.id,
    text: post.text,
    type: post.type,
    likesCount: post.likesCount,
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
