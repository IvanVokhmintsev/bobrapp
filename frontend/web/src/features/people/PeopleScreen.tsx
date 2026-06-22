import { useEffect, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";

import { api, type ApiUser, type ProfileType } from "../../api";
import defaultAvatar from "../../assets/feed/card-cover.png";
import levelFlagIcon from "../../assets/profile/level-flag.svg";
import { useAuth } from "../../context/AuthContext";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import { getMusicianLevelFromUser } from "../../lib/musicianLevel";
import { getProfileType } from "../../lib/profileType";
import { ProfileTypeBadge } from "../profile/ProfileTypeBadge";
import "./people.css";

type ProfileFilter = "all" | ProfileType;

const filterOptions: Array<{ value: ProfileFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "solo", label: "Соло" },
  { value: "band", label: "Группы" },
];

export function PeopleScreen() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [profileFilter, setProfileFilter] = useState<ProfileFilter>("all");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [error, setError] = useState("");

  async function loadProfiles(nextQuery = query, nextFilter = profileFilter) {
    try {
      setIsLoadingList(true);
      setError("");
      const result = await api.getProfiles({
        q: nextQuery,
        type: nextFilter === "all" ? undefined : nextFilter,
      });
      setUsers(result.users);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить музыкантов");
    } finally {
      setIsLoadingList(false);
    }
  }

  async function toggleFollow(event: MouseEvent, profile: ApiUser) {
    event.preventDefault();
    event.stopPropagation();

    try {
      setError("");
      if (profile.followingByMe) {
        await api.unfollowProfile(profile.id);
      } else {
        await api.followProfile(profile.id);
      }
      await loadProfiles();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось обновить подписку");
    }
  }

  async function toggleFavorite(event: MouseEvent, profile: ApiUser) {
    event.preventDefault();
    event.stopPropagation();

    try {
      setError("");
      if (profile.favoritedByMe) {
        await api.unfavoriteArtist(profile.id);
      } else {
        await api.favoriteArtist(profile.id);
      }
      await loadProfiles();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось обновить избранное");
    }
  }

  useEffect(() => {
    void loadProfiles("", "all");
  }, []);

  if (!user) {
    return null;
  }

  const isLabelViewer = user.role === "label";
  const currentUserId = user.id;

  function profilePath(profileId: string) {
    return profileId === currentUserId ? "/profile" : `/profile/${profileId}`;
  }

  return (
    <main className="app-page people-page">
      <h1>Музыканты</h1>
      <p className="app-page__intro">
        {isLabelViewer
          ? "Каталог артистов для оценки: смотрите профиль, roadmap-прогресс, ленту и сохраняйте перспективных в избранное."
          : "Находите соло-музыкантов и группы, подписывайтесь и смотрите их профили."}
      </p>

      <div className="people-filters" role="tablist" aria-label="Тип профиля">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={profileFilter === option.value}
            className={profileFilter === option.value ? "is-active" : undefined}
            onClick={() => {
              setProfileFilter(option.value);
              void loadProfiles(query, option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section className="people-search app-page__panel">
        <label>
          Поиск
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Имя"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void loadProfiles();
              }
            }}
          />
        </label>
        <button type="button" className="app-button app-button--primary" onClick={() => void loadProfiles()}>
          Найти
        </button>
      </section>

      {error ? <p className="app-page__error">{error}</p> : null}

      <section className="people-list" aria-label="Список музыкантов">
        {isLoadingList ? <p className="people-page__hint">Загрузка…</p> : null}
        {!isLoadingList && users.length === 0 ? (
          <p className="people-page__hint">Музыканты не найдены</p>
        ) : null}
        {users.map((profile) => {
          const avatarSrc = resolveAvatarUrl(profile.musicianProfile?.avatarUrl, defaultAvatar);
          const level = getMusicianLevelFromUser(profile);
          const profileType = getProfileType(profile);

          return (
            <article key={profile.id} className="people-card app-page__panel">
              <Link to={profilePath(profile.id)} className="people-card__main">
                <img className="people-card__avatar" src={avatarSrc} alt="" />
                <span className="people-card__body">
                  <span className="people-card__title-row">
                    <strong>{profile.name}</strong>
                    <ProfileTypeBadge profileType={profileType} />
                  </span>
                  <span className="people-card__bio">
                    {profile.musicianProfile?.bio?.trim() || "Биография пока пустая"}
                  </span>
                  <span className="people-card__meta">
                    Подписчики: {profile.followersCount ?? 0} · Подписки:{" "}
                    {profile.followingCount ?? 0}
                    {isLabelViewer && profile.musicianProfile
                      ? ` · Roadmap: ${profile.musicianProfile.roadmapProgress}%`
                      : ""}
                  </span>
                </span>
                <span className="people-card__level" aria-label={`Уровень ${level}`}>
                  <img src={levelFlagIcon} alt="" />
                  <strong>{level}</strong>
                </span>
              </Link>
              {profile.id !== user.id ? (
                <div className="people-card__actions">
                  <button type="button" onClick={(event) => void toggleFavorite(event, profile)}>
                    {profile.favoritedByMe ? "В избранном" : "В избранное"}
                  </button>
                  <button type="button" onClick={(event) => void toggleFollow(event, profile)}>
                    {profile.followingByMe ? "Отписаться" : "Подписаться"}
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}
