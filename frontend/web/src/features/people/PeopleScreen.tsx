import { useEffect, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";

import { api, type ApiUser, type MusicianLevel, type ProfileType } from "../../api";
import defaultAvatar from "../../assets/feed/card-cover.png";
import levelFlagIcon from "../../assets/profile/level-flag.svg";
import { useAuth } from "../../context/AuthContext";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import { MUSIC_GENRES } from "../../lib/musicGenres";
import { getMusicianLevelFromUser } from "../../lib/musicianLevel";
import { getProfileType } from "../../lib/profileType";
import { ProfileTypeBadge } from "../profile/ProfileTypeBadge";
import "./people.css";

type ProfileFilter = "all" | ProfileType;
type ProfileSort = "recent" | "roadmap" | "level";

const filterOptions: Array<{ value: ProfileFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "solo", label: "Соло" },
  { value: "band", label: "Группы" },
];

const levelOptions: Array<{ value: MusicianLevel; label: string }> = [
  { value: "nothing", label: "Почти ничего не знаю" },
  { value: "beginner", label: "Новичок" },
  { value: "advanced", label: "Продвинутый" },
  { value: "professional", label: "Профессионал" },
];

const sortOptions: Array<{ value: ProfileSort; label: string }> = [
  { value: "recent", label: "Новые" },
  { value: "roadmap", label: "По roadmap" },
  { value: "level", label: "По уровню" },
];

type SearchFilters = {
  query: string;
  profileFilter: ProfileFilter;
  city: string;
  level: MusicianLevel | "";
  roadmapStep: string;
  sort: ProfileSort;
  selectedGenres: string[];
};

const defaultFilters: SearchFilters = {
  query: "",
  profileFilter: "all",
  city: "",
  level: "",
  roadmapStep: "",
  sort: "recent",
  selectedGenres: [],
};

export function PeopleScreen() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [roadmapSteps, setRoadmapSteps] = useState<Array<{ order: number; title: string }>>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  async function loadProfiles(nextFilters = filters, cursor?: string) {
    const isMore = Boolean(cursor);

    try {
      if (isMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoadingList(true);
      }
      setError("");

      const result = await api.getProfiles({
        q: nextFilters.query || undefined,
        type: nextFilters.profileFilter === "all" ? undefined : nextFilters.profileFilter,
        genres: nextFilters.selectedGenres.length ? nextFilters.selectedGenres : undefined,
        city: nextFilters.city || undefined,
        level: nextFilters.level || undefined,
        roadmapStep: nextFilters.roadmapStep ? Number(nextFilters.roadmapStep) : undefined,
        sort: nextFilters.sort,
        cursor,
      });

      setUsers((current) =>
        isMore ? [...current, ...result.users] : result.users,
      );
      setHasNextPage(result.pageInfo.hasNextPage);
      setNextCursor(result.pageInfo.nextCursor);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить музыкантов");
    } finally {
      setIsLoadingList(false);
      setIsLoadingMore(false);
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

  function applySearch() {
    const nextFilters = {
      ...filters,
      query: draftQuery.trim(),
      city: draftCity.trim(),
    };
    setFilters(nextFilters);
    void loadProfiles(nextFilters);
  }

  function resetFilters() {
    setDraftQuery("");
    setDraftCity("");
    setFilters(defaultFilters);
    void loadProfiles(defaultFilters);
  }

  function toggleGenre(genre: string) {
    const selectedGenres = filters.selectedGenres.includes(genre)
      ? filters.selectedGenres.filter((value) => value !== genre)
      : [...filters.selectedGenres, genre];
    const nextFilters = { ...filters, selectedGenres };
    setFilters(nextFilters);
    void loadProfiles(nextFilters);
  }

  useEffect(() => {
    void loadProfiles(defaultFilters);
    void api.getRoadmap().then((result) => {
      setRoadmapSteps(
        result.steps.map((step) => ({
          order: step.order,
          title: step.title,
        })),
      );
    });
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
          ? "Каталог артистов для оценки: фильтруйте по жанрам, городу, уровню и этапу roadmap."
          : "Находите соло-музыкантов и группы, фильтруйте по жанрам, городу и прогрессу."}
      </p>

      <div className="people-filters" role="tablist" aria-label="Тип профиля">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filters.profileFilter === option.value}
            className={filters.profileFilter === option.value ? "is-active" : undefined}
            onClick={() => {
              const nextFilters = { ...filters, profileFilter: option.value };
              setFilters(nextFilters);
              void loadProfiles(nextFilters);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section className="people-search app-page__panel">
        <label>
          Поиск по имени
          <input
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Имя"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applySearch();
              }
            }}
          />
        </label>
        <label>
          Город
          <input
            value={draftCity}
            onChange={(event) => setDraftCity(event.target.value)}
            placeholder="Москва"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applySearch();
              }
            }}
          />
        </label>
        <label>
          Уровень
          <select
            value={filters.level}
            onChange={(event) => {
              const nextFilters = {
                ...filters,
                level: event.target.value as MusicianLevel | "",
              };
              setFilters(nextFilters);
              void loadProfiles(nextFilters);
            }}
          >
            <option value="">Любой</option>
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Этап roadmap
          <select
            value={filters.roadmapStep}
            onChange={(event) => {
              const nextFilters = { ...filters, roadmapStep: event.target.value };
              setFilters(nextFilters);
              void loadProfiles(nextFilters);
            }}
          >
            <option value="">Любой</option>
            {roadmapSteps.map((step) => (
              <option key={step.order} value={String(step.order)}>
                {step.order}. {step.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Сортировка
          <select
            value={filters.sort}
            onChange={(event) => {
              const nextFilters = {
                ...filters,
                sort: event.target.value as ProfileSort,
              };
              setFilters(nextFilters);
              void loadProfiles(nextFilters);
            }}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="people-search__actions">
          <button type="button" className="app-button app-button--primary" onClick={applySearch}>
            Найти
          </button>
          <button type="button" className="app-button" onClick={resetFilters}>
            Сбросить
          </button>
        </div>
      </section>

      <section className="people-genres app-page__panel" aria-label="Фильтр по жанрам">
        <p className="people-genres__label">Жанры</p>
        <div className="people-genres__list">
          {MUSIC_GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              className={filters.selectedGenres.includes(genre) ? "is-active" : undefined}
              onClick={() => toggleGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
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
          const genres = profile.musicianProfile?.genres ?? [];
          const location = profile.musicianProfile?.location?.trim();

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
                    {location ? `${location} · ` : ""}
                    {genres.length ? `${genres.slice(0, 3).join(", ")} · ` : ""}
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
        {hasNextPage ? (
          <button
            type="button"
            className="app-button people-list__more"
            disabled={isLoadingMore}
            onClick={() => void loadProfiles(filters, nextCursor ?? undefined)}
          >
            {isLoadingMore ? "Загрузка…" : "Показать ещё"}
          </button>
        ) : null}
      </section>
    </main>
  );
}
