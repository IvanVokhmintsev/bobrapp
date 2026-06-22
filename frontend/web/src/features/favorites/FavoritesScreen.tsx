import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api, type ApiUser } from "../../api";
import defaultAvatar from "../../assets/feed/card-cover.png";
import levelFlagIcon from "../../assets/profile/level-flag.svg";
import { useAuth } from "../../context/AuthContext";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import { getMusicianLevelFromUser } from "../../lib/musicianLevel";
import { getProfileType } from "../../lib/profileType";
import { FeedPostStream } from "../feed/FeedPostStream";
import { useFeedInteractions } from "../feed/useFeedInteractions";
import { ProfileTypeBadge } from "../profile/ProfileTypeBadge";
import "../feed/feed.css";
import "./favorites.css";

type FavoritesTab = "artists" | "posts";

export function FavoritesScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<FavoritesTab>("artists");
  const [artists, setArtists] = useState<ApiUser[]>([]);
  const [isLoadingArtists, setIsLoadingArtists] = useState(true);
  const [error, setError] = useState("");
  const postsFeed = useFeedInteractions({ source: "favorites" });

  async function loadArtists() {
    try {
      setIsLoadingArtists(true);
      setError("");
      const result = await api.getFavoriteArtists();
      setArtists(result.users);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить избранных артистов");
    } finally {
      setIsLoadingArtists(false);
    }
  }

  useEffect(() => {
    void loadArtists();
  }, []);

  async function removeArtist(artistId: string) {
    try {
      setError("");
      await api.unfavoriteArtist(artistId);
      setArtists((current) => current.filter((artist) => artist.id !== artistId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось убрать из избранного");
    }
  }

  if (!user) {
    return null;
  }

  const currentUserId = user.id;

  function profilePath(profileId: string) {
    return profileId === currentUserId ? "/profile" : `/profile/${profileId}`;
  }

  return (
    <main className="app-page favorites-page">
      <h1>Избранное</h1>
      <p className="app-page__intro">
        Сохранённые артисты и публикации для последующего просмотра.
      </p>

      <div className="favorites-tabs" role="tablist" aria-label="Раздел избранного">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "artists"}
          className={tab === "artists" ? "is-active" : undefined}
          onClick={() => setTab("artists")}
        >
          Артисты
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "posts"}
          className={tab === "posts" ? "is-active" : undefined}
          onClick={() => setTab("posts")}
        >
          Публикации
        </button>
      </div>

      {error ? <p className="app-page__error">{error}</p> : null}
      {postsFeed.error ? <p className="app-page__error">{postsFeed.error}</p> : null}

      {tab === "artists" ? (
        <section className="favorites-artists" aria-label="Избранные артисты">
          {isLoadingArtists ? <p className="favorites-page__hint">Загрузка…</p> : null}
          {!isLoadingArtists && artists.length === 0 ? (
            <p className="favorites-page__hint">
              Пока нет сохранённых артистов. Добавляйте их из раздела «Музыканты» или с профиля.
            </p>
          ) : null}
          {artists.map((artist) => {
            const avatarSrc = resolveAvatarUrl(artist.musicianProfile?.avatarUrl, defaultAvatar);
            const level = getMusicianLevelFromUser(artist);
            const profileType = getProfileType(artist);

            return (
              <article key={artist.id} className="favorites-artist app-page__panel">
                <Link to={profilePath(artist.id)} className="favorites-artist__main">
                  <img className="favorites-artist__avatar" src={avatarSrc} alt="" />
                  <span className="favorites-artist__body">
                    <span className="favorites-artist__title-row">
                      <strong>{artist.name}</strong>
                      <ProfileTypeBadge profileType={profileType} />
                    </span>
                    <span className="favorites-artist__bio">
                      {artist.musicianProfile?.bio?.trim() || "Биография пока пустая"}
                    </span>
                  </span>
                  <span className="favorites-artist__level" aria-label={`Уровень ${level}`}>
                    <img src={levelFlagIcon} alt="" />
                    <strong>{level}</strong>
                  </span>
                </Link>
                <button type="button" onClick={() => void removeArtist(artist.id)}>
                  Убрать
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <FeedPostStream
          feed={postsFeed}
          currentUser={user}
          className="favorites-posts"
          ariaLabel="Избранные публикации"
          showEmpty
          emptyMessage="Пока нет сохранённых публикаций. Добавляйте их из ленты кнопкой закладки."
        />
      )}
    </main>
  );
}
