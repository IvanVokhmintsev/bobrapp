import { useEffect, useState } from "react";

import {
  api,
  type ApiComment,
  type ApiPost,
  type ApiUser,
  type PostType,
} from "../../api";
import bookmarkActionIcon from "../../assets/feed/bookmark-action.png";
import cardCoverImage from "../../assets/feed/card-cover.png";
import commentActionIcon from "../../assets/feed/comment-action.png";
import concertCrowdImage from "../../assets/feed/concert-crowd.png";
import concertStageImage from "../../assets/feed/concert-stage.png";
import concertWideImage from "../../assets/feed/concert-wide.png";
import coverImage from "../../assets/feed/cover.png";
import likeActionIcon from "../../assets/feed/like-action.png";
import playButtonImage from "../../assets/feed/play-button.png";
import shareActionIcon from "../../assets/feed/share-action.png";
import "./feed.css";

type FeedScreenProps = {
  token: string;
  user: ApiUser;
  onSelectTab?: (tab: "feed" | "booking" | "events" | "profile") => void;
};

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

const galleryImages = [concertWideImage, concertStageImage, concertCrowdImage];
const serviceLinks = ["Presave", "Spotify", "VK Музыка", "Apple Music"];

export function FeedScreen(props: FeedScreenProps) {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [text, setText] = useState("");
  const [type, setType] = useState<PostType>("professional");
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

  async function loadPosts() {
    const result = await api.getPosts(props.token);
    setPosts(result.posts);
  }

  useEffect(() => {
    void loadPosts().catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Failed to load feed");
    });
  }, []);

  async function createPost() {
    try {
      setError("");
      await api.createPost(props.token, { text, type });
      setText("");
      await loadPosts();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create post");
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
        ? await api.unlikePost(props.token, id)
        : await api.likePost(props.token, id);
      setPosts((currentPosts) =>
        currentPosts.map((post) => (post.id === id ? result.post : post)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update like");
    }
  }

  async function deletePost(id: string) {
    try {
      setError("");
      await api.deletePost(props.token, id);
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
      setError(caught instanceof Error ? caught.message : "Failed to delete post");
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
      const result = await api.getComments(props.token, postId);
      setCommentsByPost((current) => ({
        ...current,
        [postId]: result.comments,
      }));
    } catch (caught) {
      setExpandedCommentPostIds((current) => toggleInSet(current, postId));
      setError(caught instanceof Error ? caught.message : "Failed to load comments");
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
      const result = await api.createComment(props.token, postId, {
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
      setError(caught instanceof Error ? caught.message : "Failed to add comment");
    }
  }

  async function deleteComment(post: ApiPost, commentId: string) {
    try {
      setError("");
      await api.deleteComment(props.token, post.id, commentId);
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
        caught instanceof Error ? caught.message : "Failed to delete comment",
      );
    }
  }

  return (
    <main className="feed-screen">
      <FeedHeader />
      {props.user.role === "musician" ? (
        <PostComposer
          text={text}
          type={type}
          onTextChange={setText}
          onTypeChange={setType}
          onCreate={createPost}
        />
      ) : null}
      {error ? <p className="feed-error">{error}</p> : null}
      <section className="feed-list" aria-label="Лента постов">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={props.user}
            variant={getPostVariant(post)}
            commentsOpen={expandedCommentPostIds.has(post.id)}
            commentsLoading={loadingCommentPostIds.has(post.id)}
            comments={commentsByPost[post.id]}
            commentText={commentTextByPost[post.id] ?? ""}
            onLike={() => likePost(post.id)}
            onDeletePost={() => deletePost(post.id)}
            onToggleComments={() => toggleComments(post.id)}
            onCommentTextChange={(nextText) =>
              setCommentTextByPost((current) => ({
                ...current,
                [post.id]: nextText,
              }))
            }
            onCreateComment={() => createComment(post.id)}
            onDeleteComment={(commentId) => deleteComment(post, commentId)}
          />
        ))}
      </section>
      <ProPromo />
      <BottomNav onSelect={props.onSelectTab} />
    </main>
  );
}

function FeedHeader() {
  return (
    <header className="feed-header">
      <div>
        <p className="feed-kicker">Bobrapp</p>
        <h1>Лента</h1>
      </div>
      <div className="feed-header-actions" aria-label="Действия ленты">
        <button type="button" aria-label="Поиск">
          🔎
        </button>
        <button type="button" aria-label="Фильтры">
          ⚙
        </button>
      </div>
    </header>
  );
}

function PostComposer(props: {
  text: string;
  type: PostType;
  onTextChange: (value: string) => void;
  onTypeChange: (value: PostType) => void;
  onCreate: () => void;
}) {
  return (
    <section className="post-composer">
      <textarea
        value={props.text}
        onChange={(event) => props.onTextChange(event.target.value)}
        placeholder="Что нового у вас в музыке?"
      />
      <div className="composer-controls">
        <select
          value={props.type}
          onChange={(event) => props.onTypeChange(event.target.value as PostType)}
        >
          <option value="professional">Проф. пост</option>
          <option value="roadmap">Роудмап</option>
        </select>
        <button type="button" onClick={props.onCreate}>
          Опубликовать
        </button>
      </div>
    </section>
  );
}

function PostCard(props: {
  post: ApiPost;
  currentUser: ApiUser;
  variant: "demo" | "text" | "roadmap" | "gallery";
  commentsOpen: boolean;
  commentsLoading: boolean;
  comments?: ApiComment[];
  commentText: string;
  onLike: () => void;
  onDeletePost: () => void;
  onToggleComments: () => void;
  onCommentTextChange: (value: string) => void;
  onCreateComment: () => void;
  onDeleteComment: (commentId: string) => void;
}) {
  const canDeletePost = props.post.author.id === props.currentUser.id;

  return (
    <article className="feed-post">
      <PostAuthorRow post={props.post} canDelete={canDeletePost} onDelete={props.onDeletePost} />
      <div className="post-content-card">
        <PostBody post={props.post} variant={props.variant} />
      </div>
      <PostActions
        post={props.post}
        commentsOpen={props.commentsOpen}
        onLike={props.onLike}
        onToggleComments={props.onToggleComments}
      />
      {props.commentsOpen ? (
        <CommentsPanel
          post={props.post}
          currentUser={props.currentUser}
          comments={props.comments ?? []}
          loading={props.commentsLoading}
          commentText={props.commentText}
          onTextChange={props.onCommentTextChange}
          onCreate={props.onCreateComment}
          onDelete={props.onDeleteComment}
        />
      ) : null}
    </article>
  );
}

function PostAuthorRow(props: {
  post: ApiPost;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="post-author-row">
      <div className="post-avatar">
        {props.post.author.avatarUrl ? (
          <img src={props.post.author.avatarUrl} alt="" />
        ) : (
          <img src={cardCoverImage} alt="" />
        )}
      </div>
      <div className="post-author-copy">
        <div>
          <strong>{props.post.author.name}</strong>
          <span className="level-badge">7</span>
        </div>
        <span>{formatPostTime(props.post.createdAt)}</span>
      </div>
      <div className="post-menu">
        {props.canDelete ? (
          <button type="button" onClick={props.onDelete} aria-label="Удалить пост">
            ✕
          </button>
        ) : (
          <button type="button" aria-label="Меню поста">
            ⋯
          </button>
        )}
      </div>
    </div>
  );
}

function PostBody(props: {
  post: ApiPost;
  variant: "demo" | "text" | "roadmap" | "gallery";
}) {
  if (props.variant === "roadmap" || props.post.type === "roadmap") {
    return <RoadmapPost post={props.post} />;
  }

  if (props.variant === "demo") {
    return <DemoPost post={props.post} />;
  }

  if (props.variant === "gallery") {
    return <GalleryPost post={props.post} />;
  }

  return <TextPost post={props.post} />;
}

function DemoPost(props: { post: ApiPost }) {
  return (
    <div className="demo-post">
      <div className="demo-cover">
        <img src={cardCoverImage} alt="" />
        <img className="play-button" src={playButtonImage} alt="" />
      </div>
      <div className="service-list">
        {serviceLinks.map((label) => (
          <button type="button" key={label}>
            <span>{label}</span>
            <span>›</span>
          </button>
        ))}
      </div>
      <p>{props.post.text || "Группа добавила демо"}</p>
    </div>
  );
}

function TextPost(props: { post: ApiPost }) {
  return <p className="text-post">{props.post.text}</p>;
}

function RoadmapPost(props: { post: ApiPost }) {
  return (
    <div className="roadmap-post">
      <div className="roadmap-icon">★</div>
      <div className="roadmap-avatar">
        <img src={coverImage} alt="" />
      </div>
      <p>{props.post.text || `${props.post.author.name} достигли нового уровня`}</p>
    </div>
  );
}

function GalleryPost(props: { post: ApiPost }) {
  return (
    <div className="gallery-post">
      <div className="gallery-grid">
        {galleryImages.map((image, index) => (
          <img src={image} alt="" key={image} className={`gallery-image-${index}`} />
        ))}
        <div className="gallery-more">35 фото</div>
      </div>
      <p>{props.post.text}</p>
    </div>
  );
}

function PostActions(props: {
  post: ApiPost;
  commentsOpen: boolean;
  onLike: () => void;
  onToggleComments: () => void;
}) {
  return (
    <div className="post-actions">
      <div className="post-actions-group">
        <button
          type="button"
          className={`post-action ${props.post.likedByMe ? "active" : ""}`}
          onClick={props.onLike}
          aria-label={`Лайки: ${props.post.likesCount}`}
        >
          <img src={likeActionIcon} alt="" />
          <span>{props.post.likesCount}</span>
        </button>
        <button
          type="button"
          className={`post-action ${props.commentsOpen ? "active" : ""}`}
          onClick={props.onToggleComments}
          aria-expanded={props.commentsOpen}
          aria-label={`Комментарии: ${props.post.commentsCount}`}
        >
          <img src={commentActionIcon} alt="" />
          <span>{props.post.commentsCount}</span>
        </button>
        <button
          type="button"
          className="post-action"
          aria-label={`Репосты: ${props.post.repostsCount}`}
        >
          <img src={shareActionIcon} alt="" />
          <span>{props.post.repostsCount}</span>
        </button>
      </div>
      {props.post.type === "roadmap" ? (
        <button type="button" className="post-action roadmap-chip">
          <img src={bookmarkActionIcon} alt="" />
          <span>Роудмап</span>
          <span className="roadmap-chip-chevron" aria-hidden="true">
            ›
          </span>
        </button>
      ) : null}
    </div>
  );
}

function CommentsPanel(props: {
  post: ApiPost;
  currentUser: ApiUser;
  comments: ApiComment[];
  loading: boolean;
  commentText: string;
  onTextChange: (value: string) => void;
  onCreate: () => void;
  onDelete: (commentId: string) => void;
}) {
  return (
    <section className="feed-comments" aria-label="Комментарии">
      {props.loading ? <p className="feed-comments-status">Загрузка комментариев…</p> : null}
      {!props.loading && props.comments.length === 0 ? (
        <p className="feed-comments-status">Пока нет комментариев</p>
      ) : null}
      {props.comments.map((comment) => {
        const canDelete =
          comment.author.id === props.currentUser.id ||
          props.post.author.id === props.currentUser.id;

        return (
          <div className="feed-comment" key={comment.id}>
            <div>
              <strong>{comment.author.name}</strong>
              <p>{comment.text}</p>
            </div>
            {canDelete ? (
              <button type="button" onClick={() => props.onDelete(comment.id)}>
                Удалить
              </button>
            ) : null}
          </div>
        );
      })}
      <div className="comment-form">
        <textarea
          value={props.commentText}
          onChange={(event) => props.onTextChange(event.target.value)}
          placeholder="Оставить комментарий"
        />
        <button type="button" onClick={props.onCreate}>
          Отправить
        </button>
      </div>
    </section>
  );
}

function ProPromo() {
  return (
    <section className="pro-promo">
      <button type="button" aria-label="Закрыть промо">
        ×
      </button>
      <p>
        Оформите подписку Pro, чтобы повысить видимость ваших постов и
        разблокировать дополнительный функционал
      </p>
      <strong>попробовать от 199₽/мес ›</strong>
    </section>
  );
}

function BottomNav(props: {
  onSelect?: (tab: "feed" | "booking" | "events" | "profile") => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      <button type="button" className="active" onClick={() => props.onSelect?.("feed")}>
        <span>⌂</span>
        Лента
      </button>
      <button type="button" onClick={() => props.onSelect?.("booking")}>
        <span>♪</span>
        Букинг
      </button>
      <button type="button" onClick={() => props.onSelect?.("events")}>
        <span>◌</span>
        События
      </button>
      <button type="button" onClick={() => props.onSelect?.("profile")}>
        <span>◉</span>
        Профиль
      </button>
    </nav>
  );
}

function getPostVariant(post: ApiPost): "demo" | "text" | "roadmap" | "gallery" {
  if (post.type === "roadmap") {
    return "roadmap";
  }

  if (looksLikeGalleryPost(post.text)) {
    return "gallery";
  }

  if (looksLikeDemoPost(post.text)) {
    return "demo";
  }

  return "text";
}

function looksLikeGalleryPost(text: string) {
  return /\b(фото|gallery|галерея)\b/i.test(text);
}

function looksLikeDemoPost(text: string) {
  return /\b(демо|demo|presave|spotify)\b/i.test(text);
}

function formatPostTime(value: string) {
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
