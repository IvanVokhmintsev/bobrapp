import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { api, type ApiPost, type ApiProfileAlbum, type ApiProfileConcert, type ApiUser, type RoadmapStep } from "../../api";
import defaultAvatar from "../../assets/feed/card-cover.png";
import albumCover from "../../assets/profile/album-cover.png";
import chevronDownIcon from "../../assets/profile/chevron-down.svg";
import concertPhoto from "../../assets/profile/concert-photo.png";
import concertStadiumIcon from "../../assets/profile/concert-stadium.svg";
import memberAvatarRing from "../../assets/profile/member-avatar-ring.svg";
import verifiedBadgeIcon from "../../assets/profile/verified-badge.svg";
import { useAuth } from "../../context/AuthContext";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import type { ProfileBlockStatus } from "../../lib/profileCompleteness";
import { getProfileBlockStatuses } from "../../lib/profileCompleteness";
import { getProfileType, isBandProfile } from "../../lib/profileType";
import { resolveCoverUrl, formatProfileDate } from "../../lib/coverUrl";
import { ProfileCompleteness } from "./ProfileCompleteness";
import { ProfileContentEditSheet } from "./ProfileContentEditSheet";
import { ProfileEditSheet } from "./ProfileEditSheet";
import { AvatarPicker } from "./AvatarPicker";
import { ProfileRoadmapMap } from "./ProfileRoadmapMap";
import { ProfileTypeBadge } from "./ProfileTypeBadge";
import "./profile.css";
import "./profile-completeness.css";

import "./profile-content-edit.css";

const guideCards = [
  {
    title: "Как вырастить концерт с 100 до 1000 зрителей?",
    body: "Переход от локального выступления к крупному событию требует другой стратегии продвижения и мышления.",
    author: "И. Иванов",
  },
  {
    title: "Как собрать сильный каталог релизов?",
    body: "Планируйте релизы сериями, держите единый визуальный язык и регулярно возвращайтесь к аналитике.",
    author: "И. Иванов",
  },
];

export function ProfileScreen() {
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const { user: authUser, setUser } = useAuth();
  const isOwnProfile = !routeUserId || routeUserId === authUser?.id;
  const [user, setLocalUser] = useState<ApiUser | null>(isOwnProfile ? authUser : null);
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [contentEditOpen, setContentEditOpen] = useState(false);
  const [albums, setAlbums] = useState<ApiProfileAlbum[]>([]);
  const [concerts, setConcerts] = useState<ApiProfileConcert[]>([]);
  const [isLoading, setIsLoading] = useState(!isOwnProfile);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const shouldRedirectToOwnProfile = Boolean(routeUserId && authUser && routeUserId === authUser.id);

  useEffect(() => {
    if (isOwnProfile && authUser) {
      setLocalUser(authUser);
    }
  }, [authUser?.id, isOwnProfile]);

  useEffect(() => {
    if (!isOwnProfile || !authUser?.id) {
      return;
    }

    void api
      .getProfile()
      .then((result) => {
        setLocalUser(result.user);
      })
      .catch(() => {
        /* keep cached user */
      });
  }, [isOwnProfile, authUser?.id]);

  useEffect(() => {
    if (!routeUserId || isOwnProfile) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSelectedLevel(null);

    void api
      .getPublicProfile(routeUserId)
      .then((result) => {
        setLocalUser(result.user);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Не удалось загрузить профиль");
        setLocalUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [routeUserId, isOwnProfile]);

  useEffect(() => {
    if (!isOwnProfile) {
      setRoadmapSteps([]);
      return;
    }

    void api
      .getRoadmap()
      .then((result) => setRoadmapSteps(result.steps))
      .catch(() => setRoadmapSteps([]));
  }, [isOwnProfile]);

  useEffect(() => {
    if (!user?.id) {
      setPosts([]);
      setAlbums([]);
      setConcerts([]);
      return;
    }

    void api
      .getProfilePosts(user.id)
      .then((result) => setPosts(result.posts))
      .catch(() => setPosts([]));

    void api
      .getProfileAlbums(user.id)
      .then((result) => setAlbums(result.albums))
      .catch(() => setAlbums([]));

    void api
      .getProfileConcerts(user.id)
      .then((result) => setConcerts(result.concerts))
      .catch(() => setConcerts([]));
  }, [user?.id]);

  const members = useMemo(() => (user ? buildMembers(user) : []), [user]);
  const tags = useMemo(() => (user ? buildTags(user) : []), [user]);
  const blockStatuses = useMemo(
    () =>
      user
        ? getProfileBlockStatuses(user, {
            postsCount: posts.length,
            albumsCount: albums.length,
            concertsCount: concerts.length,
          })
        : [],
    [user, posts.length, albums.length, concerts.length],
  );
  const profileType = user ? getProfileType(user) : "solo";
  const bandProfile = user ? isBandProfile(user) : false;

  async function toggleFollow() {
    if (!user || isOwnProfile) {
      return;
    }

    try {
      setError("");
      if (user.followingByMe) {
        await api.unfollowProfile(user.id);
      } else {
        await api.followProfile(user.id);
      }
      const result = await api.getPublicProfile(user.id);
      setLocalUser(result.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось обновить подписку");
    }
  }

  if (shouldRedirectToOwnProfile) {
    return <Navigate to="/profile" replace />;
  }

  if (isLoading) {
    return <p className="app-page__hint">Загрузка профиля…</p>;
  }

  if (error && !user) {
    return <p className="app-page__error">{error}</p>;
  }

  if (!user) {
    return null;
  }

  const bio = isOwnProfile
    ? user.musicianProfile?.bio?.trim() ||
      (bandProfile
        ? "Расскажите о группе в редактировании профиля."
        : "Расскажите о себе в редактировании профиля. Здесь появится описание группы, проекта или артиста.")
    : user.musicianProfile?.bio?.trim() || (bandProfile ? "О группе пока ничего не написано" : "Биография пока пустая");

  function handleProfileSaved(nextUser: ApiUser) {
    setLocalUser(nextUser);
    setUser(nextUser);
  }

  function showComingSoon(feature: string) {
    setNotice(`${feature} будет добавлено в следующей итерации.`);
  }

  function scrollToRoadmap() {
    document.getElementById("profile-roadmap-aside")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      {error ? <p className="app-page__error">{error}</p> : null}
      {notice ? <p className="app-page__hint">{notice}</p> : null}
      <div className="profile-page">
        <main className="profile-page__middle">
          {selectedLevel === null ? (
            <ProfileSummary
              user={user}
              members={members}
              tags={tags}
              posts={posts}
              albums={albums}
              concerts={concerts}
              bio={bio}
              profileType={profileType}
              blockStatuses={blockStatuses}
              isOwnProfile={isOwnProfile}
              canOpenRoadmapLesson={isOwnProfile && authUser?.role === "musician"}
              onEdit={() => setEditOpen(true)}
              onManageContent={() => setContentEditOpen(true)}
              onAvatarUpdated={handleProfileSaved}
              onToggleFollow={() => void toggleFollow()}
              onContact={() => showComingSoon("Связаться с артистом")}
              onFavorite={() => showComingSoon("Избранное")}
              onOpenRoadmap={scrollToRoadmap}
            />
          ) : (
            <ProfileRoadmapMap
              selectedLevel={selectedLevel}
              compact
              onSelectLevel={setSelectedLevel}
            />
          )}
        </main>

        <aside className="profile-page__right" id="profile-roadmap-aside">
          {selectedLevel === null ? (
            <ProfileRoadmapMap onSelectLevel={setSelectedLevel} />
          ) : (
            <RoadmapDetail
              level={selectedLevel}
              steps={roadmapSteps}
              onBack={() => setSelectedLevel(null)}
            />
          )}
        </aside>
      </div>

      {editOpen && isOwnProfile ? (
        <ProfileEditSheet
          user={user}
          onClose={() => setEditOpen(false)}
          onSaved={handleProfileSaved}
        />
      ) : null}

      {contentEditOpen && isOwnProfile ? (
        <ProfileContentEditSheet
          albums={albums}
          concerts={concerts}
          onClose={() => setContentEditOpen(false)}
          onChanged={({ albums: nextAlbums, concerts: nextConcerts }) => {
            setAlbums(nextAlbums);
            setConcerts(nextConcerts);
            setNotice("Альбомы и концерты обновлены");
          }}
        />
      ) : null}
    </>
  );
}

function ProfileSummary(props: {
  user: ApiUser;
  members: ProfileMember[];
  tags: ProfileTag[];
  posts: ApiPost[];
  albums: ApiProfileAlbum[];
  concerts: ApiProfileConcert[];
  bio: string;
  profileType: "solo" | "band";
  blockStatuses: ProfileBlockStatus[];
  isOwnProfile: boolean;
  canOpenRoadmapLesson: boolean;
  onEdit: () => void;
  onManageContent: () => void;
  onAvatarUpdated: (user: ApiUser) => void;
  onToggleFollow: () => void;
  onContact: () => void;
  onFavorite: () => void;
  onOpenRoadmap: () => void;
}) {
  const avatarSrc = resolveAvatarUrl(props.user.musicianProfile?.avatarUrl, defaultAvatar);
  const bandProfile = props.profileType === "band";
  const socialLinks = Object.entries(props.user.musicianProfile?.socialLinks ?? {}).filter(
    ([, url]) => url.trim().length > 0,
  );

  return (
    <div className="profile-summary">
      {props.isOwnProfile ? (
        <ProfileCompleteness blocks={props.blockStatuses} showHints />
      ) : null}

      <section className="profile-card">
        <header className="profile-card__hero">
          {props.isOwnProfile ? (
            <AvatarPicker
              user={props.user}
              size="large"
              onUpdated={props.onAvatarUpdated}
            />
          ) : (
            <img className="profile-card__avatar" src={avatarSrc} alt="" />
          )}
          <div className="profile-card__identity">
            <div className="profile-card__name-row">
              <h1>{props.user.name}</h1>
              <ProfileTypeBadge profileType={props.profileType} />
              <img className="profile-card__verified" src={verifiedBadgeIcon} alt="" />
              {props.isOwnProfile ? (
                <button
                  type="button"
                  className="profile-card__chevron-btn"
                  onClick={props.onEdit}
                  aria-label="Редактировать профиль"
                >
                  <img src={chevronDownIcon} alt="" />
                </button>
              ) : null}
            </div>
            <div className="profile-card__actions">
              {props.isOwnProfile ? (
                <>
                  <button type="button" className="profile-header-action" onClick={props.onOpenRoadmap}>
                    Карта развития
                  </button>
                  {props.canOpenRoadmapLesson ? (
                    <Link className="profile-header-action profile-header-action--primary" to="/roadmap">
                      Уроки roadmap
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <button type="button" className="profile-header-action" onClick={props.onContact}>
                    Связаться с артистом
                  </button>
                  <button type="button" className="profile-header-action" onClick={props.onFavorite}>
                    В избранное
                  </button>
                  <button type="button" className="profile-header-action" onClick={props.onOpenRoadmap}>
                    Карта развития
                  </button>
                  <button
                    type="button"
                    className="profile-header-action profile-header-action--primary"
                    onClick={props.onToggleFollow}
                  >
                    {props.user.followingByMe ? "Отписаться" : "Подписаться"}
                  </button>
                </>
              )}
            </div>
            {socialLinks.length ? (
              <div className="profile-social-links">
                {socialLinks.map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noreferrer noopener">
                    {label}
                  </a>
                ))}
              </div>
            ) : props.isOwnProfile ? (
              <p className="profile-members__empty">Ссылки на музыку пока не добавлены</p>
            ) : null}
          </div>
        </header>

        {bandProfile ? (
          <section className="profile-members" aria-label="Состав">
            {props.members.length ? (
              props.members.map((member) => (
                <article key={member.id}>
                  <img src={member.avatarUrl} alt="" />
                  <span>{member.name}</span>
                </article>
              ))
            ) : (
              <p className="profile-members__empty">Состав пока не указан</p>
            )}
          </section>
        ) : null}
      </section>

      <section className="profile-block">
        <h2>{bandProfile ? "О нас" : "О себе"}</h2>
        <p>{props.bio}</p>
        <div className="profile-tags">
          {props.tags.map((tag) => (
            <span className={`profile-tag profile-tag--${tag.tone}`} key={tag.id}>
              {tag.label}
            </span>
          ))}
        </div>
      </section>

      <section className="profile-block profile-block--albums">
        <div className="profile-block__heading">
          <h2>Альбомы</h2>
          {props.isOwnProfile ? (
            <button type="button" className="profile-header-action" onClick={props.onManageContent}>
              Управлять
            </button>
          ) : null}
        </div>
        {props.albums.length ? (
          <div className="profile-albums">
            {props.albums.map((album) => (
              <article className="profile-album" key={album.id}>
                <img
                  src={resolveCoverUrl(album.coverUrl, albumCover)}
                  alt=""
                />
                <strong>{album.title}</strong>
                <span>{formatProfileDate(album.releaseDate)}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="profile-members__empty">
            {props.isOwnProfile
              ? "Добавьте альбомы через «Управлять»"
              : "Альбомов пока нет"}
          </p>
        )}
      </section>

      <section className="profile-block">
        <div className="profile-block__heading">
          <h2>Концерты</h2>
          {props.isOwnProfile ? (
            <button type="button" className="profile-header-action" onClick={props.onManageContent}>
              Управлять
            </button>
          ) : null}
        </div>
        {props.concerts.length ? (
          <div className="profile-concerts">
            {props.concerts.map((concert, index) => {
              const hasPhoto = Boolean(concert.coverUrl?.trim());
              const concertLabel = `${concert.venue} ${formatProfileDate(concert.eventDate)}`;

              return hasPhoto ? (
                <article className="profile-concert profile-concert--photo" key={concert.id}>
                  <img
                    className="profile-concert__photo"
                    src={resolveCoverUrl(concert.coverUrl, concertPhoto)}
                    alt=""
                  />
                  <img className="profile-concert__icon" src={concertStadiumIcon} alt="" />
                  <strong>{concertLabel}</strong>
                </article>
              ) : (
                <article
                  className={`profile-concert profile-concert--dark ${index % 2 === 1 ? "profile-concert--alt" : ""}`}
                  key={concert.id}
                >
                  <img src={concertStadiumIcon} alt="" />
                  <strong>{concertLabel}</strong>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="profile-members__empty">
            {props.isOwnProfile
              ? "Добавьте концерты через «Управлять»"
              : "Концертов пока нет"}
          </p>
        )}
      </section>

      <section className="profile-block">
        <h2>Публикации</h2>
        {props.posts.length ? (
          <div className="profile-posts">
            {props.posts.map((post) => (
              <article className="profile-post" key={post.id}>
                <strong>{post.type === "roadmap" ? "Roadmap" : "Пост"}</strong>
                <p>{post.text.trim() || "Без текста"}</p>
                <div className="profile-post__meta">
                  <span>{new Date(post.createdAt).toLocaleDateString("ru-RU")}</span>
                  <span>Лайки: {post.likesCount}</span>
                  <span>Комментарии: {post.commentsCount}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="profile-post__empty">Публикаций пока нет</p>
        )}
      </section>
    </div>
  );
}

function RoadmapDetail(props: {
  level: number;
  steps: RoadmapStep[];
  onBack: () => void;
}) {
  const milestones = buildMilestones(props.steps, props.level);

  return (
    <section className="profile-roadmap-detail">
      <button type="button" className="profile-roadmap-detail__back" onClick={props.onBack}>
        ‹ Уровень {props.level}
      </button>

      <div className="profile-roadmap-detail__list">
        {milestones.map((milestone) => (
          <article
            className={`profile-milestone ${milestone.completed ? "is-completed" : ""}`}
            key={milestone.id}
          >
            <span aria-hidden="true">⚙</span>
            <p>{milestone.title}</p>
          </article>
        ))}
      </div>

      <h2>Гайды и статьи по этапу:</h2>
      <div className="profile-guides">
        {guideCards.map((guide) => (
          <article className="profile-guide" key={guide.title}>
            <div>
              <h3>{guide.title}</h3>
              <p>{guide.body}</p>
              <span>{guide.author}</span>
            </div>
            <strong aria-hidden="true">›</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

type ProfileMember = {
  id: string;
  name: string;
  avatarUrl: string;
};

type ProfileTag = {
  id: string;
  label: string;
  tone: "green" | "blue";
};

function buildMembers(user: ApiUser): ProfileMember[] {
  return (user.musicianProfile?.memberNames ?? []).map((name, index) => ({
    id: `member-${index}`,
    name,
    avatarUrl: memberAvatarRing,
  }));
}

function buildTags(user: ApiUser): ProfileTag[] {
  const band = isBandProfile(user);
  const source = [
    ...(user.musicianProfile?.genres ?? []),
    ...(band ? [] : user.musicianProfile?.instruments ?? []),
    ...user.achievements.map((achievement) => achievement.title),
  ].filter(Boolean);

  const labels = source.length > 0 ? source.slice(0, 4) : [];

  return labels.map((label, index) => ({
    id: `${label}-${index}`,
    label,
    tone: index === 0 ? "green" : "blue",
  }));
}

function buildMilestones(steps: RoadmapStep[], level: number) {
  const fallback = [
    "Майлстоун «Сильный каталог»: Более трёх альбомов записано и релизнуто",
    "Майлстоун «Стабильные концерты»: Собран регулярный концертный график",
    "Майлстоун «Промо»: Оформлены материалы для продвижения релиза",
    "Майлстоун «Команда»: Распределены роли и зона ответственности",
    "Майлстоун «Аудитория»: Появился устойчивый канал коммуникации",
    "Майлстоун «Сцена»: Подготовлена программа для выступления",
    "Майлстоун «Аналитика»: Зафиксированы цели следующего этапа",
  ];

  if (steps.length === 0) {
    return fallback.map((title, index) => ({
      id: `${level}-${index}`,
      title,
      completed: index < 5,
    }));
  }

  return steps.slice(0, 7).map((step, index) => ({
    id: step.id,
    title: `Майлстоун «${step.title}»: ${step.description}`,
    completed: step.status === "completed" || index < Math.max(1, 9 - level),
  }));
}
