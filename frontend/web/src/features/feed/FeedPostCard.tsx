import { useEffect, useRef, useState } from "react";

import type { ApiComment, ApiPost, ApiUser } from "../../api";
import commentIcon from "../../assets/feed/comment-action.png";
import defaultAvatar from "../../assets/feed/card-cover.png";
import likeIcon from "../../assets/feed/like-action.png";
import musicNoteIcon from "../../assets/feed/music-note.svg";
import levelFlagIcon from "../../assets/profile/level-flag.svg";
import { getMusicianLevel } from "../../lib/musicianLevel";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import {
  formatAudioDuration,
  getDemoCoverSrc,
  getPostDisplayMode,
  readAudioCoverFromUrl,
  revokeObjectUrl,
  type FeedPostMedia,
} from "./feedPostMedia";
import type { FeedPostCardHandlers, FeedPostCardState } from "./useFeedInteractions";
import { formatPostTime } from "./useFeedInteractions";

const DEMO_AUDIO_TITLE = "Любим Древесину – Крутые бобры";
const DEMO_AUDIO_DURATION_SEC = 172;

type FeedPostCardProps = FeedPostCardHandlers &
  FeedPostCardState & {
    post: ApiPost;
    currentUser: ApiUser;
    media?: FeedPostMedia;
  };

export function FeedPostCard(props: FeedPostCardProps) {
  const canDelete = props.post.author.id === props.currentUser.id;
  const avatarSrc = resolveAvatarUrl(props.post.author.avatarUrl, defaultAvatar);
  const level = getAuthorLevel(props.post, props.currentUser);
  const displayMode = getPostDisplayMode(props.post, props.media);
  const caption = getPostCaption(props.post, displayMode);

  return (
    <article className="feed-card" data-post-type={props.post.type}>
      <header className="feed-card__header">
        <div className="feed-card__author">
          <div className="feed-card__avatar-stack" aria-hidden="true">
            <span className="feed-card__avatar-ring feed-card__avatar-ring--dark" />
            <span className="feed-card__avatar-ring feed-card__avatar-ring--muted" />
            <img className="feed-card__avatar" src={avatarSrc} alt="" />
          </div>
          <div className="feed-card__meta">
            <div className="feed-card__name-row">
              <span className="feed-card__name">{props.post.author.name}</span>
              {props.post.author.role === "musician" ? (
                <span className="feed-card__level" aria-label={`Уровень ${level}`}>
                  <img src={levelFlagIcon} alt="" />
                  <strong>{level}</strong>
                </span>
              ) : null}
              <time className="feed-card__time" dateTime={props.post.createdAt}>
                {formatPostTime(props.post.createdAt)}
              </time>
            </div>
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
        {displayMode === "roadmap" ? (
          <RoadmapBody post={props.post} coverSrc={avatarSrc} />
        ) : displayMode === "demo" ? (
          <DemoBody
            post={props.post}
            media={props.media}
            caption={caption}
          />
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
  );
}

function DemoBody(props: {
  post: ApiPost;
  media?: FeedPostMedia;
  caption: string;
}) {
  const extractedCoverUrl = useAudioCoverFallback(props.media);
  const coverSrc = getDemoCoverSrc(props.media, extractedCoverUrl);
  const audioTitle =
    props.media?.audioTitle ??
    (props.media?.audioUrl ? "Демо-трек" : DEMO_AUDIO_TITLE);
  const audioDurationSec =
    props.media?.audioDurationSec ??
    (props.media?.audioUrl ? null : DEMO_AUDIO_DURATION_SEC);
  const showAudio = Boolean(props.media?.audioUrl) || !props.post.text.trim();

  return (
    <div className="feed-card__body feed-card__body--demo">
      <p className="feed-card__caption">{props.caption}</p>
      <div className="feed-card__demo-cover">
        <img src={coverSrc} alt="" />
      </div>
      {showAudio ? (
        <AudioBar
          audioUrl={props.media?.audioUrl}
          title={audioTitle}
          durationSec={audioDurationSec}
        />
      ) : null}
    </div>
  );
}

function AudioBar(props: {
  audioUrl?: string | null;
  title: string;
  durationSec: number | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <div className="feed-card__audio">
      <button
        type="button"
        className="feed-card__audio-play"
        aria-label="Воспроизвести"
        onClick={() => {
          const audio = audioRef.current;
          if (!audio) {
            return;
          }

          if (audio.paused) {
            void audio.play();
          } else {
            audio.pause();
          }
        }}
      >
        <img src={musicNoteIcon} alt="" />
      </button>
      <div className="feed-card__audio-meta">
        <span className="feed-card__audio-title">{props.title}</span>
        <span className="feed-card__audio-duration">
          {formatAudioDuration(props.durationSec)}
        </span>
      </div>
      {props.audioUrl ? <audio ref={audioRef} src={props.audioUrl} preload="metadata" /> : null}
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
  if (post.author.id === currentUser.id) {
    return getMusicianLevel(currentUser.musicianProfile?.points);
  }

  return getMusicianLevel(null);
}

function useAudioCoverFallback(media?: FeedPostMedia) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const coverUrlRef = useRef<string | null>(null);

  useEffect(() => {
    coverUrlRef.current = coverUrl;
  }, [coverUrl]);

  useEffect(() => {
    if (media?.imageUrl || !media?.audioUrl) {
      revokeObjectUrl(coverUrlRef.current);
      setCoverUrl(null);
      return;
    }

    let cancelled = false;

    void readAudioCoverFromUrl(media.audioUrl).then((nextCoverUrl) => {
      if (cancelled) {
        revokeObjectUrl(nextCoverUrl);
        return;
      }

      setCoverUrl((current) => {
        if (current && current !== nextCoverUrl) {
          revokeObjectUrl(current);
        }
        return nextCoverUrl;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [media?.audioUrl, media?.imageUrl]);

  useEffect(() => {
    return () => {
      revokeObjectUrl(coverUrlRef.current);
    };
  }, []);

  return coverUrl;
}
