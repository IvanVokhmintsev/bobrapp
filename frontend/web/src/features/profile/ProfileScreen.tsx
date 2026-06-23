import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { api, type ApiProfileAlbum, type ApiProfileConcert, type ApiUser } from "../../api";
import defaultAvatar from "../../assets/feed/card-cover.png";
import albumCover from "../../assets/profile/album-cover.png";
import concertPhoto from "../../assets/profile/concert-photo.png";
import memberAvatarRing from "../../assets/profile/member-avatar-ring.svg";
import verifiedBadgeIcon from "../../assets/profile/verified-badge.svg";
import { useAuth } from "../../context/AuthContext";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import type { ProfileBlockStatus } from "../../lib/profileCompleteness";
import { getProfileBlockStatuses } from "../../lib/profileCompleteness";
import { getProfileType, isBandProfile } from "../../lib/profileType";
import { resolveCoverUrl, formatProfileDate } from "../../lib/coverUrl";
import { ProfileCompleteness } from "./ProfileCompleteness";
import { ProfileContentEditSheet, type ProfileContentEditKind } from "./ProfileContentEditSheet";
import { ProfileEditableTrigger } from "./ProfileEditableTrigger";
import { ProfileEditSheet } from "./ProfileEditSheet";
import { AvatarPicker } from "./AvatarPicker";
import { useFeedInteractions } from "../feed/useFeedInteractions";
import { ProfilePostsSection } from "./ProfilePostsSection";
import { ProfileCareerTimeline } from "./ProfileCareerTimeline";
import { LabelProfileScreen } from "./LabelProfileScreen";
import { ContactProposalSheet } from "../proposals/ContactProposalSheet";
import { ProfileTypeBadge } from "./ProfileTypeBadge";
import { getSocialPlatformLabel, normalizeExternalUrl } from "../../lib/socialPlatforms";
import { resolveProfileMembers } from "../../lib/profileMembers";
import "./profile.css";
import "./profile-completeness.css";
import "./profile-career.css";

import "./profile-content-edit.css";

export function ProfileScreen() {
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const { user: authUser, setUser } = useAuth();
  const isOwnProfile = !routeUserId || routeUserId === authUser?.id;
  const [user, setLocalUser] = useState<ApiUser | null>(isOwnProfile ? authUser : null);
  const [editOpen, setEditOpen] = useState(false);
  const [contentEdit, setContentEdit] = useState<{
    kind: ProfileContentEditKind;
    itemId: string | null;
  } | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [albums, setAlbums] = useState<ApiProfileAlbum[]>([]);
  const [concerts, setConcerts] = useState<ApiProfileConcert[]>([]);
  const [isLoading, setIsLoading] = useState(!isOwnProfile);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const shouldRedirectToOwnProfile = Boolean(routeUserId && authUser && routeUserId === authUser.id);
  const profileFeed = useFeedInteractions({
    profileUserId: user?.id,
    enabled: Boolean(user?.id),
  });

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
    if (!user?.id) {
      setAlbums([]);
      setConcerts([]);
      return;
    }

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
            postsCount: profileFeed.posts.length,
            albumsCount: albums.length,
            concertsCount: concerts.length,
          })
        : [],
    [user, profileFeed.posts.length, albums.length, concerts.length],
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

  async function toggleFavorite() {
    if (!user || isOwnProfile) {
      return;
    }

    try {
      setError("");
      if (user.favoritedByMe) {
        await api.unfavoriteArtist(user.id);
        setNotice("Артист убран из избранного");
      } else {
        await api.favoriteArtist(user.id);
        setNotice("Артист добавлен в избранное");
      }
      const result = await api.getPublicProfile(user.id);
      setLocalUser(result.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось обновить избранное");
    }
  }

  if (shouldRedirectToOwnProfile) {
    return <Navigate to="/profile" replace />;
  }

  if (isOwnProfile && authUser?.role === "label") {
    return (
      <LabelProfileScreen
        user={authUser}
        onSaved={(nextUser) => {
          setUser(nextUser);
          setLocalUser(nextUser);
        }}
      />
    );
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

  function handleContact() {
    if (!user || isOwnProfile) {
      return;
    }

    if (user.musicianProfile?.acceptsProposals === false) {
      setNotice("Артист не принимает предложения о сотрудничестве через платформу.");
      return;
    }

    setContactOpen(true);
  }

  return (
    <>
      {error ? <p className="app-page__error">{error}</p> : null}
      {notice ? <p className="app-page__hint">{notice}</p> : null}
      <div className="profile-page">
        <main className="profile-page__main">
          <div className="profile-page__column">
            <ProfileSummary
              user={user}
              members={members}
              tags={tags}
              albums={albums}
              concerts={concerts}
              bio={bio}
              profileType={profileType}
              blockStatuses={blockStatuses}
              isOwnProfile={isOwnProfile}
              canOpenRoadmap={isOwnProfile && authUser?.role === "musician"}
              viewerRole={authUser?.role}
              onEdit={() => setEditOpen(true)}
              onAddAlbum={() => setContentEdit({ kind: "albums", itemId: null })}
              onAddConcert={() => setContentEdit({ kind: "concerts", itemId: null })}
              onEditAlbum={(album) => setContentEdit({ kind: "albums", itemId: album.id })}
              onEditConcert={(concert) =>
                setContentEdit({ kind: "concerts", itemId: concert.id })
              }
              onAvatarUpdated={handleProfileSaved}
              onToggleFollow={() => void toggleFollow()}
              onContact={handleContact}
              onFavorite={() => void toggleFavorite()}
            />
            <ProfileCareerTimeline user={user} posts={profileFeed.posts} />
            {authUser ? (
              <ProfilePostsSection
                currentUser={authUser}
                feed={profileFeed}
              />
            ) : null}
          </div>
        </main>
      </div>

      {editOpen && isOwnProfile ? (
        <ProfileEditSheet
          user={user}
          onClose={() => setEditOpen(false)}
          onSaved={handleProfileSaved}
        />
      ) : null}

      {contentEdit && isOwnProfile ? (
        <ProfileContentEditSheet
          kind={contentEdit.kind}
          itemId={contentEdit.itemId}
          albums={albums}
          concerts={concerts}
          onClose={() => setContentEdit(null)}
          onChanged={({ albums: nextAlbums, concerts: nextConcerts }, action) => {
            setAlbums(nextAlbums);
            setConcerts(nextConcerts);
            const isAlbums = contentEdit.kind === "albums";
            setNotice(
              action === "delete"
                ? isAlbums
                  ? "Альбом удалён"
                  : "Концерт удалён"
                : action === "update"
                  ? isAlbums
                    ? "Альбом обновлён"
                    : "Концерт обновлён"
                  : isAlbums
                    ? "Альбом добавлен"
                    : "Концерт добавлен",
            );
          }}
        />
      ) : null}

      {contactOpen && user && !isOwnProfile ? (
        <ContactProposalSheet
          artist={user}
          incompleteBlocks={blockStatuses}
          onClose={() => setContactOpen(false)}
          onSent={() => setNotice("Предложение отправлено. Смотрите статус в разделе «Предложения».")}
        />
      ) : null}
    </>
  );
}

function ProfileSummary(props: {
  user: ApiUser;
  members: ProfileMember[];
  tags: ProfileTag[];
  albums: ApiProfileAlbum[];
  concerts: ApiProfileConcert[];
  bio: string;
  profileType: "solo" | "band";
  blockStatuses: ProfileBlockStatus[];
  isOwnProfile: boolean;
  canOpenRoadmap: boolean;
  viewerRole?: ApiUser["role"];
  onEdit: () => void;
  onAddAlbum: () => void;
  onAddConcert: () => void;
  onEditAlbum: (album: ApiProfileAlbum) => void;
  onEditConcert: (concert: ApiProfileConcert) => void;
  onAvatarUpdated: (user: ApiUser) => void;
  onToggleFollow: () => void;
  onContact: () => void;
  onFavorite: () => void;
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

      <section className="profile-card profile-section">
        <div className="profile-card__header-row">
          <div className="profile-card__hero">
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
              </div>
              {props.viewerRole === "label" && props.user.musicianProfile ? (
                <p className="profile-card__label-note">
                  Roadmap: {props.user.musicianProfile.roadmapProgress}% · смотрите карьерный путь и
                  публикации ниже
                </p>
              ) : null}
              <div className="profile-card__actions">
              {props.isOwnProfile ? (
                props.canOpenRoadmap ? (
                  <>
                    <Link className="profile-header-action" to="/proposals">
                      Предложения
                    </Link>
                    <Link className="profile-header-action" to="/roadmap/map">
                      Карта развития
                    </Link>
                    <Link className="profile-header-action profile-header-action--primary" to="/roadmap">
                      Уроки roadmap
                    </Link>
                  </>
                ) : null
              ) : (
                <>
                  {props.user.musicianProfile?.acceptsProposals === false ? (
                    <span className="profile-header-action profile-header-action--disabled">
                      Контакт недоступен
                    </span>
                  ) : (
                    <button type="button" className="profile-header-action" onClick={props.onContact}>
                      Связаться с артистом
                    </button>
                  )}
                  <button
                    type="button"
                    className={`profile-header-action ${
                      props.user.favoritedByMe ? "profile-header-action--active" : ""
                    }`}
                    onClick={props.onFavorite}
                  >
                    {props.user.favoritedByMe ? "В избранном" : "В избранное"}
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
          </div>
          </div>
          {props.isOwnProfile ? (
            <button
              type="button"
              className="profile-card__edit-btn"
              onClick={props.onEdit}
            >
              Редактировать
            </button>
          ) : null}
        </div>

        {bandProfile ? (
          <section className="profile-members" aria-label="Состав">
            {props.members.length ? (
              props.members.map((member) => (
                <article key={member.id}>
                  <img src={member.avatarUrl} alt="" />
                  <div className="profile-member__text">
                    <span className="profile-member__name">{member.name}</span>
                    {member.role ? (
                      <span className="profile-member__role">{member.role}</span>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <p className="profile-members__empty">Состав пока не указан</p>
            )}
          </section>
        ) : null}
      </section>

      {socialLinks.length || props.isOwnProfile ? (
        <section className="profile-block profile-section">
          <h2>Ссылки</h2>
          {socialLinks.length ? (
            <div className="profile-social-links">
              {socialLinks.map(([platform, url]) => (
                <a
                  key={platform}
                  href={normalizeExternalUrl(url)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {getSocialPlatformLabel(platform)}
                </a>
              ))}
            </div>
          ) : (
            <p className="profile-members__empty">Добавьте ссылки в редактировании профиля</p>
          )}
        </section>
      ) : null}

      <section className="profile-block profile-section">
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

      <section className="profile-block profile-block--albums profile-section">
        <div className="profile-block__heading">
          <h2>Альбомы</h2>
          {props.isOwnProfile ? (
            <button type="button" className="profile-header-action" onClick={props.onAddAlbum}>
              Добавить
            </button>
          ) : null}
        </div>
        {props.albums.length ? (
          <div className="profile-albums">
            {props.albums.map((album) => (
              <article className="profile-album" key={album.id}>
                {props.isOwnProfile ? (
                  <ProfileEditableTrigger
                    className="profile-editable-trigger--album"
                    label={`Редактировать альбом «${album.title}»`}
                    onEdit={() => props.onEditAlbum(album)}
                  >
                    <img
                      src={resolveCoverUrl(album.coverUrl, albumCover)}
                      alt=""
                    />
                  </ProfileEditableTrigger>
                ) : (
                  <img
                    src={resolveCoverUrl(album.coverUrl, albumCover)}
                    alt=""
                  />
                )}
                <strong>{album.title}</strong>
                <span>{formatProfileDate(album.releaseDate)}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="profile-members__empty">
            {props.isOwnProfile ? "Добавьте первый альбом" : "Альбомов пока нет"}
          </p>
        )}
      </section>

      <section className="profile-block profile-block--albums profile-section">
        <div className="profile-block__heading">
          <h2>Концерты</h2>
          {props.isOwnProfile ? (
            <button type="button" className="profile-header-action" onClick={props.onAddConcert}>
              Добавить
            </button>
          ) : null}
        </div>
        {props.concerts.length ? (
          <div className="profile-albums">
            {props.concerts.map((concert) => (
              <article className="profile-album" key={concert.id}>
                {props.isOwnProfile ? (
                  <ProfileEditableTrigger
                    className="profile-editable-trigger--album"
                    label={`Редактировать концерт «${concert.venue}»`}
                    onEdit={() => props.onEditConcert(concert)}
                  >
                    <img
                      src={resolveCoverUrl(concert.coverUrl, concertPhoto)}
                      alt=""
                    />
                  </ProfileEditableTrigger>
                ) : (
                  <img
                    src={resolveCoverUrl(concert.coverUrl, concertPhoto)}
                    alt=""
                  />
                )}
                <strong>{concert.venue}</strong>
                <span>{formatProfileDate(concert.eventDate)}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="profile-members__empty">
            {props.isOwnProfile ? "Добавьте первый концерт" : "Концертов пока нет"}
          </p>
        )}
      </section>
    </div>
  );
}

type ProfileMember = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
};

type ProfileTag = {
  id: string;
  label: string;
  tone: "green" | "blue";
};

function buildMembers(user: ApiUser): ProfileMember[] {
  return resolveProfileMembers(
    user.musicianProfile?.members,
    user.musicianProfile?.memberNames,
  ).map((member, index) => ({
    id: `member-${index}`,
    name: member.name,
    role: member.role,
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
