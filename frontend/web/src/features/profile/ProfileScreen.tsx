import { useEffect, useMemo, useState } from "react";

import { api, type ApiUser } from "../../api";
import defaultAvatar from "../../assets/feed/card-cover.png";
import albumCover from "../../assets/feed/card-cover.png";
import concertPhoto from "../../assets/feed/concert-wide.png";
import { FeedPostCard } from "../feed/FeedPostCard";
import { useFeedInteractions } from "../feed/useFeedInteractions";
import type { AppTab } from "../navigation/AppTabBar";
import { AppTabBar } from "../navigation/AppTabBar";
import { ProfileEditSheet } from "./ProfileEditSheet";
import "./profile.css";

type ProfileScreenProps = {
  token: string;
  user: ApiUser;
  onUserChange: (user: ApiUser) => void;
  onSelectTab?: (tab: AppTab) => void;
  onOpenRoadmap?: () => void;
};

const placeholderAlbums = [
  { title: "Любим древесину", date: "10 янв 2025" },
  { title: "Любим древесину", date: "10 янв 2025" },
  { title: "Любим древесину", date: "10 янв 2025" },
] as const;

export function ProfileScreen(props: ProfileScreenProps) {
  const [user, setUser] = useState(props.user);
  const [editing, setEditing] = useState(false);
  const posts = useFeedInteractions(props.token, { profileUserId: user.id });

  useEffect(() => {
    setUser(props.user);
  }, [props.user]);

  useEffect(() => {
    void api
      .getProfile(props.token)
      .then((result) => {
        setUser(result.user);
        props.onUserChange(result.user);
      })
      .catch(() => {
        /* keep cached user */
      });
  }, [props.token]);

  const avatarSrc = user.musicianProfile?.avatarUrl ?? defaultAvatar;
  const level = getLevel(user);
  const members = useMemo(() => buildMembers(user), [user]);
  const tags = useMemo(() => buildTags(user), [user]);
  const bio =
    user.musicianProfile?.bio?.trim() ||
    "Расскажите о себе в редактировании профиля — здесь появится описание группы.";

  function handleUserSaved(nextUser: ApiUser) {
    setUser(nextUser);
    props.onUserChange(nextUser);
  }

  return (
    <div className="profile">
      <main className="profile__main">
        <header className="profile__topbar">
          <h1 className="profile__title">Мой профиль</h1>
          <div className="profile__topbar-actions">
            <button
              type="button"
              className="profile__icon-btn"
              aria-label="Редактировать"
              onClick={() => setEditing(true)}
            >
              <EditIcon />
            </button>
            <button type="button" className="profile__icon-btn" aria-label="Настройки">
              <SettingsIcon />
            </button>
          </div>
        </header>

        <section className="profile__hero">
          <img className="profile__avatar" src={avatarSrc} alt="" />
          <div className="profile__hero-copy">
            <div className="profile__name-row">
              <h2 className="profile__name">{user.name}</h2>
              <span className="profile__level" aria-label={`Уровень ${level}`}>
                {level}
              </span>
              <span className="profile__crown" aria-hidden="true">
                👑
              </span>
              <button type="button" className="profile__chevron" aria-label="Меню имени">
                ›
              </button>
            </div>
            <div className="profile__quick-actions">
              <button type="button" className="profile__pill" aria-label="Календарь">
                <CalendarIcon />
              </button>
              <button type="button" className="profile__pill" aria-label="Сайт">
                <GlobeIcon />
              </button>
              <button type="button" className="profile__pill" aria-label="Сообщения">
                <MessageIcon />
              </button>
            </div>
          </div>
        </section>

        {members.length > 0 ? (
          <section className="profile__members" aria-label="Состав">
            <div className="profile__members-track">
              {members.map((member) => (
                <article className="profile__member" key={member.id}>
                  <img src={member.avatarUrl ?? avatarSrc} alt="" />
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <button
          type="button"
          className="profile__roadmap-btn"
          onClick={props.onOpenRoadmap}
        >
          <span>🗺 Роудмап</span>
          {(user.musicianProfile?.roadmapProgress ?? 0) < 100 ? (
            <span className="profile__roadmap-badge">1</span>
          ) : null}
        </button>

        <section className="profile__section">
          <h3>О нас:</h3>
          <div className="profile__about-card">
            <p>{bio}</p>
            {tags.length > 0 ? (
              <div className="profile__tags">
                {tags.map((tag) => (
                  <span className={`profile__tag profile__tag--${tag.tone}`} key={tag.id}>
                    {tag.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="profile__section">
          <h3>Альбомы:</h3>
          <div className="profile__albums-track">
            {placeholderAlbums.map((album, index) => (
              <article className="profile__album" key={`${album.title}-${index}`}>
                <img src={albumCover} alt="" />
                <strong>{album.title}</strong>
                <span>{album.date}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="profile__section">
          <h3>Концерты:</h3>
          <div className="profile__concerts-track">
            <article className="profile__concert profile__concert--ticket">
              <span className="profile__concert-icon" aria-hidden="true">
                🏟
              </span>
              <div>
                <strong>СК «Олимпийский»</strong>
                <span>20:00</span>
              </div>
              <button type="button">Купить билет</button>
            </article>
            <article className="profile__concert profile__concert--photo">
              <img src={concertPhoto} alt="" />
              <div className="profile__concert-overlay">
                <strong>СК «Олимпийский»</strong>
                <span>20:00</span>
              </div>
            </article>
          </div>
        </section>

        <section className="profile__section profile__section--posts">
          <h3>Посты:</h3>
          {posts.error ? <p className="profile__error">{posts.error}</p> : null}
          {posts.posts.length === 0 ? (
            <p className="profile__empty">У вас пока нет постов</p>
          ) : null}
          <div className="profile__posts">
            {posts.posts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                currentUser={user}
                commentsOpen={posts.expandedCommentPostIds.has(post.id)}
                commentsLoading={posts.loadingCommentPostIds.has(post.id)}
                comments={posts.commentsByPost[post.id]}
                commentText={posts.commentTextByPost[post.id] ?? ""}
                onLike={() => void posts.likePost(post.id)}
                onDeletePost={() => void posts.deletePost(post.id)}
                onToggleComments={() => void posts.toggleComments(post.id)}
                onCommentTextChange={(value) => posts.setCommentText(post.id, value)}
                onCreateComment={() => void posts.createComment(post.id)}
                onDeleteComment={(commentId) => void posts.deleteComment(post, commentId)}
              />
            ))}
          </div>
        </section>
      </main>

      <AppTabBar active="profile" onSelect={props.onSelectTab} />

      {editing ? (
        <ProfileEditSheet
          token={props.token}
          user={user}
          onClose={() => setEditing(false)}
          onSaved={handleUserSaved}
        />
      ) : null}
    </div>
  );
}

function getLevel(user: ApiUser) {
  const points = user.musicianProfile?.points ?? 0;
  return Math.min(9, Math.max(1, Math.floor(points / 15) + 1));
}

function buildMembers(user: ApiUser) {
  const instruments = user.musicianProfile?.instruments ?? [];
  if (instruments.length === 0) {
    return [];
  }

  const names = ["Иван Иванов", "Петр Петров", "Анна Анова", "Сергей Серов"];

  return instruments.slice(0, 4).map((instrument, index) => ({
    id: `${instrument}-${index}`,
    name: names[index] ?? `Участник ${index + 1}`,
    role: instrument,
    avatarUrl: user.musicianProfile?.avatarUrl ?? null,
  }));
}

function buildTags(user: ApiUser) {
  const tones = ["green", "red", "purple", "orange"] as const;
  const fromGenres = (user.musicianProfile?.genres ?? []).map((genre, index) => ({
    id: `genre-${genre}`,
    label: genre,
    tone: tones[index % tones.length],
  }));
  const fromAchievements = (user.achievements ?? []).slice(0, 2).map((item, index) => ({
    id: `ach-${item.id}`,
    label: item.title,
    tone: tones[(index + fromGenres.length) % tones.length],
  }));
  const tags = [...fromGenres, ...fromAchievements];

  if (tags.length > 4) {
    return [
      ...tags.slice(0, 4),
      { id: "more", label: `Ещё ${tags.length - 4}`, tone: "muted" as const },
    ];
  }

  return tags;
}

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M12.3 3.7l3 3L6.5 15.5H3.5v-3l8.8-8.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path
        d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="3" y="4" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path d="M3 7h12M6 2v3M12 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path d="M2.5 9h13M9 2.5c2 2 2 11 0 13M9 2.5c-2 2-2 11 0 13" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M3 4h12v7a3 3 0 0 1-3 3H8l-3 3v-3H6a3 3 0 0 1-3-3V4Z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
    </svg>
  );
}
