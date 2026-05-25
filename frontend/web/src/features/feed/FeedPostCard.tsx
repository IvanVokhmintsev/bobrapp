import type { ApiComment, ApiPost, ApiUser } from "../../api";
import bookmarkIcon from "../../assets/feed/bookmark-action.png";
import defaultCover from "../../assets/feed/card-cover.png";
import commentIcon from "../../assets/feed/comment-action.png";
import likeIcon from "../../assets/feed/like-action.png";
import playIcon from "../../assets/feed/play-button.png";
import shareIcon from "../../assets/feed/share-action.png";
import type { FeedPostCardHandlers, FeedPostCardState } from "./useFeedInteractions";
import { formatPostTime } from "./useFeedInteractions";

const presaveLinks = [
  { id: "vk", label: "Пресейв", brand: "vk" },
  { id: "apple", label: "Пресейв", brand: "apple" },
  { id: "spotify", label: "Пресейв", brand: "spotify" },
] as const;

type FeedPostCardProps = FeedPostCardHandlers &
  FeedPostCardState & {
    post: ApiPost;
    currentUser: ApiUser;
  };

export function FeedPostCard(props: FeedPostCardProps) {
  const canDelete = props.post.author.id === props.currentUser.id;
  const coverSrc = props.post.author.avatarUrl ?? defaultCover;
  const level = getAuthorLevel(props.post, props.currentUser);
  const caption = getPostCaption(props.post);

  return (
    <article className="feed-card" data-post-type={props.post.type}>
      <header className="feed-card__header">
        <div className="feed-card__author">
          <div className="feed-card__avatar-stack" aria-hidden="true">
            <span className="feed-card__avatar-ring feed-card__avatar-ring--dark" />
            <span className="feed-card__avatar-ring feed-card__avatar-ring--muted" />
            <img className="feed-card__avatar" src={coverSrc} alt="" />
          </div>
          <div className="feed-card__meta">
            <div className="feed-card__name-row">
              <span className="feed-card__name">{props.post.author.name}</span>
              {props.post.author.role === "musician" ? (
                <span className="feed-card__level" aria-label={`Уровень ${level}`}>
                  {level}
                </span>
              ) : null}
            </div>
            <time className="feed-card__time" dateTime={props.post.createdAt}>
              {formatPostTime(props.post.createdAt)}
            </time>
          </div>
        </div>
        <div className="feed-card__menu">
          {canDelete ? (
            <button
              type="button"
              className="feed-card__menu-btn"
              onClick={props.onDeletePost}
              aria-label="Удалить пост"
            >
              ×
            </button>
          ) : (
            <button type="button" className="feed-card__menu-dots" aria-label="Меню поста">
              <span />
              <span />
              <span />
            </button>
          )}
        </div>
      </header>

      <div className="feed-card__panel">
        {props.post.type === "roadmap" ? (
          <RoadmapBody post={props.post} coverSrc={coverSrc} />
        ) : (
          <ProfessionalBody post={props.post} coverSrc={coverSrc} />
        )}
        <p className="feed-card__caption">{caption}</p>
      </div>

      <footer className="feed-card__footer">
        <div className="feed-card__stats">
          <button
            type="button"
            className={`feed-card__stat ${props.post.likedByMe ? "is-active" : ""}`}
            onClick={props.onLike}
            aria-label={`Лайки: ${props.post.likesCount}`}
          >
            <img src={likeIcon} alt="" />
            <span>{props.post.likesCount}</span>
          </button>
          <button
            type="button"
            className={`feed-card__stat ${props.commentsOpen ? "is-active" : ""}`}
            onClick={props.onToggleComments}
            aria-expanded={props.commentsOpen}
            aria-label={`Комментарии: ${props.post.commentsCount}`}
          >
            <img src={commentIcon} alt="" />
            <span>{props.post.commentsCount}</span>
          </button>
          <button
            type="button"
            className="feed-card__stat"
            aria-label={`Репосты: ${props.post.repostsCount}`}
          >
            <img src={shareIcon} alt="" />
            <span>{props.post.repostsCount}</span>
          </button>
        </div>
        <button type="button" className="feed-card__roadmap">
          <img src={bookmarkIcon} alt="" />
          <span>Роудмап</span>
          <span className="feed-card__roadmap-chevron" aria-hidden="true">
            ›
          </span>
        </button>
      </footer>

      {props.commentsOpen ? (
        <CommentsBlock
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

function ProfessionalBody(props: { post: ApiPost; coverSrc: string }) {
  return (
    <div className="feed-card__body feed-card__body--demo">
      <div className="feed-card__demo-cover">
        <img src={props.coverSrc} alt="" />
        <img className="feed-card__play" src={playIcon} alt="" />
      </div>
      <div className="feed-card__services">
        {presaveLinks.map((link) => (
          <button key={link.id} type="button" className="feed-card__service">
            <span className={`feed-card__service-icon feed-card__service-icon--${link.brand}`} />
            <span className="feed-card__service-label">{link.label}</span>
            <span className="feed-card__service-chevron" aria-hidden="true">
              ›
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RoadmapBody(props: { post: ApiPost; coverSrc: string }) {
  return (
    <div className="feed-card__body feed-card__body--roadmap">
      <span className="feed-card__roadmap-star" aria-hidden="true">
        ★
      </span>
      <img className="feed-card__roadmap-avatar" src={props.coverSrc} alt="" />
      <p className="feed-card__roadmap-text">
        {props.post.text || `${props.post.author.name} достигли нового уровня`}
      </p>
    </div>
  );
}

function CommentsBlock(props: {
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
    <section className="feed-card__comments" aria-label="Комментарии">
      {props.loading ? <p className="feed-card__comments-empty">Загрузка…</p> : null}
      {!props.loading && props.comments.length === 0 ? (
        <p className="feed-card__comments-empty">Пока нет комментариев</p>
      ) : null}
      <ul className="feed-card__comment-list">
        {props.comments.map((comment) => {
          const canDelete =
            comment.author.id === props.currentUser.id ||
            props.post.author.id === props.currentUser.id;

          return (
            <li className="feed-card__comment" key={comment.id}>
              <div>
                <strong>{comment.author.name}</strong>
                <p>{comment.text}</p>
              </div>
              {canDelete ? (
                <button type="button" onClick={() => props.onDelete(comment.id)}>
                  Удалить
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
      <form
        className="feed-card__comment-form"
        onSubmit={(event) => {
          event.preventDefault();
          props.onCreate();
        }}
      >
        <textarea
          value={props.commentText}
          onChange={(event) => props.onTextChange(event.target.value)}
          placeholder="Оставить комментарий"
          rows={2}
        />
        <button type="submit">Отправить</button>
      </form>
    </section>
  );
}

function getPostCaption(post: ApiPost) {
  if (post.text.trim()) {
    return post.text;
  }

  if (post.type === "roadmap") {
    return `${post.author.name} достигли нового уровня`;
  }

  return `${post.author.name} добавили демо`;
}

function getAuthorLevel(post: ApiPost, currentUser: ApiUser) {
  if (post.author.id === currentUser.id && currentUser.musicianProfile) {
    const points = currentUser.musicianProfile.points;
    return Math.min(9, Math.max(1, Math.floor(points / 15) + 1));
  }

  return 7;
}
