import { useCallback, useEffect, useMemo, useState } from "react";

import {
  api,
  type ApiComment,
  type ApiPost,
  type ApiUser,
} from "../../api";

type CommentsByPost = Record<string, ApiComment[]>;
type CommentTextByPost = Record<string, string>;

function toggleInSet(values: Set<string>, id: string) {
  const next = new Set(values);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

type UseFeedInteractionsOptions = {
  profileUserId?: string;
};

export function useFeedInteractions(options?: UseFeedInteractionsOptions) {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [text, setText] = useState("");
  const [composerImage, setComposerImage] = useState<File | null>(null);
  const [composerAudio, setComposerAudio] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [commentsByPost, setCommentsByPost] = useState<CommentsByPost>({});
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState(
    () => new Set<string>(),
  );
  const [loadingCommentPostIds, setLoadingCommentPostIds] = useState(
    () => new Set<string>(),
  );
  const [commentTextByPost, setCommentTextByPost] =
    useState<CommentTextByPost>({});

  const loadPosts = useCallback(async () => {
    const result = options?.profileUserId
      ? await api.getProfilePosts(options.profileUserId)
      : await api.getPosts();
    setPosts(result.posts);
  }, [options?.profileUserId]);

  useEffect(() => {
    void loadPosts().catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить ленту");
    });
  }, [loadPosts]);

  const visiblePosts = useMemo(() => posts, [posts]);

  function resetComposer() {
    setText("");
    setComposerImage(null);
    setComposerAudio(null);
  }

  async function createPost() {
    const trimmedText = text.trim();
    const hasAttachments = Boolean(composerImage || composerAudio);

    if (!trimmedText && !hasAttachments) {
      setError("Добавьте текст, фото или аудио");
      return;
    }

    try {
      setIsPublishing(true);
      setError("");

      const result = await api.createPost({
        text: trimmedText,
        type: "professional",
        image: composerImage,
        audio: composerAudio,
      });

      setPosts((currentPosts) => [
        result.post,
        ...currentPosts.filter((post) => post.id !== result.post.id),
      ]);
      resetComposer();
      await loadPosts();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось опубликовать пост");
    } finally {
      setIsPublishing(false);
    }
  }

  async function likePost(id: string) {
    const target = posts.find((post) => post.id === id);
    if (!target) {
      return;
    }

    try {
      setError("");
      const result = target.likedByMe
        ? await api.unlikePost(id)
        : await api.likePost(id);
      setPosts((currentPosts) =>
        currentPosts.map((post) => (post.id === id ? result.post : post)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось обновить лайк");
    }
  }

  async function deletePost(id: string) {
    try {
      setError("");
      await api.deletePost(id);
      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
      setCommentsByPost((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setExpandedCommentPostIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      setLoadingCommentPostIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось удалить пост");
    }
  }

  async function toggleComments(postId: string) {
    if (expandedCommentPostIds.has(postId)) {
      setExpandedCommentPostIds((current) => toggleInSet(current, postId));
      return;
    }

    setExpandedCommentPostIds((current) => toggleInSet(current, postId));

    if (commentsByPost[postId] !== undefined) {
      return;
    }

    setLoadingCommentPostIds((current) => toggleInSet(current, postId));

    try {
      setError("");
      const result = await api.getComments(postId);
      setCommentsByPost((current) => ({
        ...current,
        [postId]: result.comments,
      }));
    } catch (caught) {
      setExpandedCommentPostIds((current) => toggleInSet(current, postId));
      setError(
        caught instanceof Error ? caught.message : "Не удалось загрузить комментарии",
      );
    } finally {
      setLoadingCommentPostIds((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    }
  }

  async function createComment(postId: string) {
    const commentText = commentTextByPost[postId]?.trim();
    if (!commentText) {
      return;
    }

    try {
      setError("");
      const result = await api.createComment(postId, {
        text: commentText,
      });
      setCommentsByPost((current) => ({
        ...current,
        [postId]: [...(current[postId] ?? []), result.comment],
      }));
      setCommentTextByPost((current) => ({
        ...current,
        [postId]: "",
      }));
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? { ...post, commentsCount: post.commentsCount + 1 }
            : post,
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось добавить комментарий");
    }
  }

  async function deleteComment(post: ApiPost, commentId: string) {
    try {
      setError("");
      await api.deleteComment(post.id, commentId);
      setCommentsByPost((current) => ({
        ...current,
        [post.id]: (current[post.id] ?? []).filter(
          (comment) => comment.id !== commentId,
        ),
      }));
      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === post.id
            ? {
                ...currentPost,
                commentsCount: Math.max(0, currentPost.commentsCount - 1),
              }
            : currentPost,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Не удалось удалить комментарий",
      );
    }
  }

  function setCommentText(postId: string, value: string) {
    setCommentTextByPost((current) => ({
      ...current,
      [postId]: value,
    }));
  }

  return {
    posts: visiblePosts,
    text,
    setText,
    composerImage,
    setComposerImage,
    composerAudio,
    setComposerAudio,
    isPublishing,
    error,
    createPost,
    likePost,
    deletePost,
    toggleComments,
    createComment,
    deleteComment,
    setCommentText,
    commentsByPost,
    expandedCommentPostIds,
    loadingCommentPostIds,
    commentTextByPost,
  };
}

export type FeedPostCardHandlers = {
  onLike: () => void;
  onDeletePost: () => void;
  onToggleComments: () => void;
  onCommentTextChange: (value: string) => void;
  onCreateComment: () => void;
  onDeleteComment: (commentId: string) => void;
};

export type FeedPostCardState = {
  commentsOpen: boolean;
  commentsLoading: boolean;
  comments?: ApiComment[];
  commentText: string;
};

export function formatPostTime(value: string) {
  const createdAt = new Date(value).getTime();
  const minutes = Math.max(1, Math.round((Date.now() - createdAt) / 60000));

  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} ч`;
  }

  return `${Math.round(hours / 24)} д`;
}

export type { ApiPost, ApiUser };
