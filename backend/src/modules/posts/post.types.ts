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
