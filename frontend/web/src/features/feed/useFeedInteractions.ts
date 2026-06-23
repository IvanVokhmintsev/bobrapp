import { useCallback, useEffect, useMemo, useState } from "react";

import {
  api,
  type ApiComment,
  type ApiPost,
  type ApiUser,
  type PageInfo,
  type PostType,
} from "../../api";
import type { FeedPostTypeFilter } from "./FeedFiltersPanel";

type CommentsByPost = Record<string, ApiComment[]>;
type CommentTextByPost = Record<string, string>;

const emptyPageInfo: PageInfo = {
  hasNextPage: false,
  nextCursor: null,
};

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
  enabled?: boolean;
  source?: "feed" | "profile" | "favorites";
  postType?: FeedPostTypeFilter;
};

export function useFeedInteractions(options?: UseFeedInteractionsOptions) {
  const enabled = options?.enabled ?? true;
  const profileUserId = options?.profileUserId;
  const source = options?.source ?? (profileUserId ? "profile" : "feed");
  const postTypeFilter = options?.postType ?? "all";
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>(emptyPageInfo);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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

  const fetchFeedPosts = useCallback(
    async (cursor?: string) => {
      return api.getPosts({
        cursor,
        type: postTypeFilter === "all" ? undefined : (postTypeFilter as PostType),
      });
    },
    [postTypeFilter],
  );

  const loadPosts = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setIsLoadingPosts(true);
      setError("");

      const result =
        source === "favorites"
          ? await api.getFavoritePosts()
          : profileUserId
            ? await api.getProfilePosts(profileUserId)
            : await fetchFeedPosts();

      setPosts(result.posts);
      setPageInfo(result.pageInfo ?? emptyPageInfo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить ленту");
    } finally {
      setIsLoadingPosts(false);
    }
  }, [enabled, fetchFeedPosts, profileUserId, source]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  async function loadMorePosts() {
    if (source !== "feed" || !pageInfo.hasNextPage || !pageInfo.nextCursor || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      setError("");
      const result = await fetchFeedPosts(pageInfo.nextCursor);
      setPosts((currentPosts) => [...currentPosts, ...result.posts]);
      setPageInfo(result.pageInfo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить ещё посты");
    } finally {
      setIsLoadingMore(false);
    }
  }

  const visiblePosts = useMemo(() => posts, [posts]);

  function resetComposer() {
    setText("");
    setComposerImage(null);
    setComposerAudio(null);
  }

  async function createPost(): Promise<boolean> {
    const trimmedText = text.trim();
    const hasAttachments = Boolean(composerImage || composerAudio);

    if (!trimmedText && !hasAttachments) {
      setError("Добавьте текст, фото или аудио");
      return false;
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
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось опубликовать пост");
      return false;
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

  async function favoritePost(id: string) {
    const target = posts.find((post) => post.id === id);
    if (!target) {
      return;
    }

    try {
      setError("");
      const result = target.favoritedByMe
        ? await api.unfavoritePost(id)
        : await api.favoritePost(id);

      if (source === "favorites" && target.favoritedByMe) {
        setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
      } else {
        setPosts((currentPosts) =>
          currentPosts.map((post) => (post.id === id ? result.post : post)),
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Не удалось обновить избранное",
      );
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

  async function updatePost(id: string, text: string) {
    try {
      setError("");
      const result = await api.updatePost(id, { text });
      setPosts((currentPosts) =>
        currentPosts.map((post) => (post.id === id ? result.post : post)),
      );
      return result.post;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить пост");
      throw caught;
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
    pageInfo,
    isLoadingPosts,
    isLoadingMore,
    loadMorePosts,
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
    favoritePost,
    deletePost,
    updatePost,
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
  onFavorite: () => void;
  onToggleComments: () => void;
  onCommentTextChange: (value: string) => void;
  onCreateComment: () => void;
  onDeleteComment: (commentId: string) => void;
  onSavePost?: (text: string) => Promise<void>;
  onDeletePost?: () => void;
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
