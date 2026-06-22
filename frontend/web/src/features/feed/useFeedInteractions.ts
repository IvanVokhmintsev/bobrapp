import { useCallback, useEffect, useMemo, useState } from "react";

import {
  api,
  type ApiComment,
  type ApiPost,
  type ApiUser,
} from "../../api";
import {
  buildAudioTitleFromMetadata,
  type FeedPostMedia,
  readAudioFileMetadata,
  revokeObjectUrl,
} from "./feedPostMedia";

type CommentsByPost = Record<string, ApiComment[]>;
type CommentTextByPost = Record<string, string>;
type PostMediaById = Record<string, FeedPostMedia>;

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
  const [composerAudioDurationSec, setComposerAudioDurationSec] = useState<
    number | null
  >(null);
  const [composerAudioCoverUrl, setComposerAudioCoverUrl] = useState<string | null>(
    null,
  );
  const [composerAudioTags, setComposerAudioTags] = useState<{
    title: string | null;
    artist: string | null;
  }>({ title: null, artist: null });
  const [postMediaById, setPostMediaById] = useState<PostMediaById>({});
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

  useEffect(() => {
    if (!composerAudio) {
      setComposerAudioDurationSec(null);
      setComposerAudioTags({ title: null, artist: null });
      setComposerAudioCoverUrl((current) => {
        revokeObjectUrl(current);
        return null;
      });
      return;
    }

    let cancelled = false;

    void readAudioFileMetadata(composerAudio).then((metadata) => {
      if (cancelled) {
        revokeObjectUrl(metadata.coverUrl);
        return;
      }

      setComposerAudioCoverUrl((current) => {
        revokeObjectUrl(current);
        return metadata.coverUrl;
      });
      setComposerAudioDurationSec(metadata.durationSec);
      setComposerAudioTags({
        title: metadata.title,
        artist: metadata.artist,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [composerAudio]);

  function setComposerAudioFile(file: File | null) {
    setComposerAudio(file);
  }

  function setComposerImageFile(file: File | null) {
    setComposerImage(file);
  }

  const visiblePosts = useMemo(() => posts, [posts]);

  function resetComposer(transferredCoverUrl: string | null = null) {
    setText("");
    setComposerImage(null);
    setComposerAudio(null);
    setComposerAudioDurationSec(null);
    setComposerAudioTags({ title: null, artist: null });
    setComposerAudioCoverUrl((current) => {
      if (current && current !== transferredCoverUrl) {
        revokeObjectUrl(current);
      }
      return null;
    });
  }

  async function createPost(currentUser: ApiUser) {
    const trimmedText = text.trim();
    const hasAttachments = Boolean(composerImage || composerAudio);

    if (!trimmedText && !hasAttachments) {
      setError("Добавьте текст, фото или аудио");
      return;
    }

    const audioCoverForPost = !composerImage ? composerAudioCoverUrl : null;
    const imageUrl = composerImage
      ? URL.createObjectURL(composerImage)
      : audioCoverForPost;
    const audioUrl = composerAudio ? URL.createObjectURL(composerAudio) : null;
    const audioTitle = composerAudio
      ? buildAudioTitleFromMetadata(
          composerAudioTags,
          composerAudio.name,
          currentUser.name,
        )
      : null;

    const localMedia: FeedPostMedia = {
      imageUrl,
      audioUrl,
      audioTitle,
      audioDurationSec: composerAudioDurationSec,
    };

    try {
      setError("");

      if (trimmedText || !hasAttachments) {
        const result = await api.createPost({
          text: trimmedText,
          type: "professional",
        });

        if (hasAttachments) {
          setPostMediaById((current) => ({
            ...current,
            [result.post.id]: localMedia,
          }));
        }

        resetComposer(audioCoverForPost);
        await loadPosts();
        return;
      }

      const optimisticPost: ApiPost = {
        id: `local-${crypto.randomUUID()}`,
        text: trimmedText,
        type: "professional",
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        likedByMe: false,
        repostedByMe: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          avatarUrl: currentUser.musicianProfile?.avatarUrl ?? null,
        },
      };

      setPostMediaById((current) => ({
        ...current,
        [optimisticPost.id]: localMedia,
      }));
      setPosts((currentPosts) => [optimisticPost, ...currentPosts]);
      resetComposer(audioCoverForPost);
    } catch (caught) {
      if (hasAttachments) {
        const optimisticPost: ApiPost = {
          id: `local-${crypto.randomUUID()}`,
          text: trimmedText,
          type: "professional",
          likesCount: 0,
          commentsCount: 0,
          repostsCount: 0,
          likedByMe: false,
          repostedByMe: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role,
            avatarUrl: currentUser.musicianProfile?.avatarUrl ?? null,
          },
        };

        setPostMediaById((current) => ({
          ...current,
          [optimisticPost.id]: localMedia,
        }));
        setPosts((currentPosts) => [optimisticPost, ...currentPosts]);
        resetComposer(audioCoverForPost);
        setError(
          caught instanceof Error
            ? `${caught.message}. Пост сохранён только локально.`
            : "Пост сохранён только локально.",
        );
        return;
      }

      setError(caught instanceof Error ? caught.message : "Не удалось опубликовать пост");
    }
  }

  async function likePost(id: string) {
    if (id.startsWith("local-")) {
      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if (post.id !== id) {
            return post;
          }

          const likedByMe = !post.likedByMe;
          return {
            ...post,
            likedByMe,
            likesCount: Math.max(0, post.likesCount + (likedByMe ? 1 : -1)),
          };
        }),
      );
      return;
    }

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
    if (id.startsWith("local-")) {
      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
      setPostMediaById((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      return;
    }

    try {
      setError("");
      await api.deletePost(id);
      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
      setPostMediaById((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
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
    if (postId.startsWith("local-")) {
      setExpandedCommentPostIds((current) => toggleInSet(current, postId));
      return;
    }

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

    if (postId.startsWith("local-")) {
      setCommentTextByPost((current) => ({
        ...current,
        [postId]: "",
      }));
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
    postMediaById,
    text,
    setText,
    composerImage,
    setComposerImage: setComposerImageFile,
    composerAudio,
    setComposerAudio: setComposerAudioFile,
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
