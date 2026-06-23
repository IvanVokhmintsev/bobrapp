import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import type { ApiComment, ApiPost, ApiUser } from "../../api";
import commentIcon from "../../assets/feed/comment-action.png";
import shareIcon from "../../assets/feed/share-action.png";
import { BookmarkIcon } from "../../components/BookmarkIcon";
import { HeartIcon } from "../../components/HeartIcon";
import defaultAvatar from "../../assets/feed/card-cover.png";
import playIcon from "../../assets/feed/play-button.png";
import { LevelBadge } from "../../components/LevelBadge";
import { getMusicianLevel } from "../../lib/musicianLevel";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import { getProfilePath } from "../../lib/profilePath";
import { ProfileTypeBadge } from "../profile/ProfileTypeBadge";
import { FeedPostEditSheet } from "./FeedPostEditSheet";
import { FeedPostMenu } from "./FeedPostMenu";
import { getPostDisplayMode } from "./feedPostMedia";
import { resolveUploadUrl } from "../../lib/mediaUrl";
import type { FeedPostCardHandlers, FeedPostCardState } from "./useFeedInteractions";
import { formatPostTime } from "./useFeedInteractions";

type FeedPostCardProps = FeedPostCardHandlers &
  FeedPostCardState & {
    post: ApiPost;
    currentUser: ApiUser;
  };

export function FeedPostCard(props: FeedPostCardProps) {
  const isOwnPost = props.post.author.id === props.currentUser.id;
  const canFavoriteFooter = !isOwnPost;
  const canRepost = props.currentUser.role === "musician" && !isOwnPost;
  const [editOpen, setEditOpen] = useState(false);
  const avatarSrc = resolveAvatarUrl(props.post.author.avatarUrl, defaultAvatar);
  const displayMode = getPostDisplayMode(props.post);
  const caption = getPostCaption(props.post, displayMode);
  const authorProfilePath = getProfilePath(props.post.author.id, props.currentUser.id);

  return (
    <>
      <article className="feed-card" data-post-type={props.post.type} id={`post-${props.post.id}`}>
        <header className="feed-card__header">
          <Link className="feed-card__author" to={authorProfilePath}>
            <div className="feed-card__avatar-stack" aria-hidden="true">
              <span className="feed-card__avatar-ring feed-card__avatar-ring--dark" />
              <span className="feed-card__avatar-ring feed-card__avatar-ring--muted" />
              <img className="feed-card__avatar" src={avatarSrc} alt="" />
            </div>
            <div className="feed-card__meta">
              <div className="feed-card__name-row">
                <span className="feed-card__name">{props.post.author.name}</span>
                <ProfileTypeBadge profileType={props.post.author.profileType ?? "solo"} />
                {props.post.author.role === "musician" ? (
                  <LevelBadge level={getAuthorLevel(props.post, props.currentUser)} />
                ) : null}
                <time className="feed-card__time" dateTime={props.post.createdAt}>
                  {formatPostTime(props.post.createdAt)}
                </time>
              </div>
            </div>
          </Link>
          <FeedPostMenu
            post={props.post}
            currentUserId={props.currentUser.id}
            isOwnPost={isOwnPost}
            onFavorite={props.onFavorite}
            onEdit={isOwnPost && props.onSavePost ? () => setEditOpen(true) : undefined}
            onDelete={isOwnPost && props.onDeletePost ? props.onDeletePost : undefined}
          />
        </header>

        <div className="feed-card__panel">
          {displayMode === "roadmap" ? (
            <RoadmapBody post={props.post} coverSrc={avatarSrc} />
          ) : displayMode === "demo" ? (
            <DemoBody post={props.post} caption={caption} />
          ) : (
            <p className="feed-card__caption feed-card__caption--solo">{caption}</p>
          )}
        </div>

        <footer className="feed-card__footer">
          <div className="feed-card__stats">
            <button
              type="button"
              className={`feed-card__stat feed-card__stat--like ${
                props.post.likedByMe ? "is-active" : ""
              }`}
              onClick={props.onLike}
              aria-label={`Лайки: ${props.post.likesCount}`}
              aria-pressed={props.post.likedByMe}
            >
              <HeartIcon filled={props.post.likedByMe} size={26} />
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
            {canRepost && props.onRepost ? (
              <button
                type="button"
                className={`feed-card__stat feed-card__stat--repost ${
                  props.post.repostedByMe ? "is-active" : ""
                }`}
                onClick={props.onRepost}
                aria-label={`Репосты: ${props.post.repostsCount}`}
                aria-pressed={props.post.repostedByMe}
              >
                <img src={shareIcon} alt="" />
                <span>{props.post.repostsCount}</span>
              </button>
            ) : null}
            {canFavoriteFooter ? (
              <button
                type="button"
                className={`feed-card__stat feed-card__stat--favorite ${
                  props.post.favoritedByMe ? "is-active" : ""
                }`}
                onClick={props.onFavorite}
                aria-label={props.post.favoritedByMe ? "Убрать из избранного" : "В избранное"}
                aria-pressed={props.post.favoritedByMe}
              >
                <BookmarkIcon filled={props.post.favoritedByMe} size={26} />
              </button>
            ) : null}
          </div>
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

      {editOpen && props.onSavePost ? (
        <FeedPostEditSheet
          post={props.post}
          onClose={() => setEditOpen(false)}
          onSave={props.onSavePost}
        />
      ) : null}
    </>
  );
}

function DemoBody(props: { post: ApiPost; caption: string }) {
  const imageUrl = resolveUploadUrl(props.post.imageUrl);
  const audioUrl = resolveUploadUrl(props.post.audioUrl);

  return (
    <div className="feed-card__body feed-card__body--demo">
      <p className="feed-card__caption">{props.caption}</p>
      <DemoCover imageUrl={imageUrl} audioUrl={audioUrl} />
    </div>
  );
}

function DemoCover(props: { imageUrl?: string | null; audioUrl?: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayable = Boolean(props.audioUrl);

  function togglePlayback() {
    if (!props.audioUrl) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  return (
    <button
      type="button"
      className={`feed-card__demo-cover ${isPlayable ? "is-playable" : ""} ${
        isPlaying ? "is-playing" : ""
      } ${props.imageUrl ? "has-image" : "is-placeholder"}`}
      onClick={togglePlayback}
      disabled={!isPlayable}
      aria-label={isPlayable ? (isPlaying ? "Пауза" : "Воспроизвести") : "Демо"}
    >
      {props.imageUrl ? <img src={props.imageUrl} alt="" /> : null}
      {isPlayable ? (
        <>
          <span className="feed-card__demo-play" aria-hidden="true">
            <img src={playIcon} alt="" />
          </span>
          <audio
            ref={audioRef}
            src={props.audioUrl ?? undefined}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        </>
      ) : null}
    </button>
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
      {props.loading ? <p className="feed-card__comments-empty">Загрузка...</p> : null}
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

function getPostCaption(post: ApiPost, displayMode: "demo" | "text" | "roadmap") {
  if (post.text.trim()) {
    return post.text;
  }

  if (displayMode === "roadmap") {
    return `${post.author.name} достигли нового уровня`;
  }

  return `${post.author.name} добавили демо`;
}

function getAuthorLevel(post: ApiPost, currentUser: ApiUser) {
  if (post.author.role !== "musician") {
    return 1;
  }

  if (post.author.points != null) {
    return getMusicianLevel(post.author.points);
  }

  if (post.author.id === currentUser.id) {
    return getMusicianLevel(currentUser.musicianProfile?.points);
  }

  return getMusicianLevel(null);
}
