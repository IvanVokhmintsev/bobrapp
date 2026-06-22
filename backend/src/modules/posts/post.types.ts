export type PostType = "professional" | "roadmap";

export type CreatePostBody = {
  text: string;
  type: PostType;
};

export type PostIdParams = {
  id: string;
};

export type CreateCommentBody = {
  text: string;
};

export type CommentParams = {
  id: string;
  commentId: string;
};

export type FeedQuery = {
  cursor?: string;
  limit?: number;
  type?: PostType;
};
