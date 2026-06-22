import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api, type ApiPost, type ApiUser } from "../../api";
import { useAuth } from "../../context/AuthContext";

export function DiscoverScreen() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section") ?? "booking";
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [error, setError] = useState("");

  async function loadProfiles(nextQuery = query) {
    try {
      setError("");
      const result = await api.getProfiles({ q: nextQuery });
      setUsers(result.users);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load profiles");
    }
  }

  async function openProfile(userId: string) {
    try {
      setError("");
      const [profileResult, postsResult] = await Promise.all([
        api.getPublicProfile(userId),
        api.getProfilePosts(userId),
      ]);
      setSelectedUser(profileResult.user);
      setPosts(postsResult.posts);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to open profile");
    }
  }

  async function toggleFollow(profile: ApiUser) {
    if (profile.followingByMe) {
      await api.unfollowProfile(profile.id);
    } else {
      await api.followProfile(profile.id);
    }
    await loadProfiles();
    if (selectedUser?.id === profile.id) {
      await openProfile(profile.id);
    }
  }

  useEffect(() => {
    void loadProfiles("");
  }, []);

  if (!user) {
    return null;
  }

  const title = section === "events" ? "События" : "Букинг";

  return (
    <main className="app-page">
      <h1>{title}</h1>
      <p className="app-page__intro">
        Находите музыкантов, подписывайтесь и смотрите их публикации.
      </p>

      <section className="app-page__panel">
        <label>
          Поиск
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Имя"
          />
        </label>
        <button type="button" onClick={() => void loadProfiles()}>
          Найти
        </button>
      </section>

      {error ? <p className="app-page__error">{error}</p> : null}

      <div className="app-page__split">
        <section>
          {users.map((profile) => (
            <article className="app-page__panel" key={profile.id}>
              <strong>{profile.name}</strong>
              <p>{profile.musicianProfile?.bio ?? "Биография пока пустая"}</p>
              <p>
                Подписчики: {profile.followersCount ?? 0} / Подписки:{" "}
                {profile.followingCount ?? 0}
              </p>
              <div className="app-page__actions">
                <button type="button" onClick={() => void openProfile(profile.id)}>
                  Открыть
                </button>
                {profile.id !== user.id ? (
                  <button type="button" onClick={() => void toggleFollow(profile)}>
                    {profile.followingByMe ? "Отписаться" : "Подписаться"}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        {selectedUser ? (
          <section className="app-page__panel">
            <h2>{selectedUser.name}</h2>
            <p>{selectedUser.musicianProfile?.bio ?? "Биография пока пустая"}</p>
            <p>{selectedUser.musicianProfile?.location ?? ""}</p>
            <p>Жанры: {selectedUser.musicianProfile?.genres.join(", ")}</p>
            <p>Инструменты: {selectedUser.musicianProfile?.instruments.join(", ")}</p>
            <p>DAW: {selectedUser.musicianProfile?.daw.join(", ")}</p>
            {selectedUser.id !== user.id ? (
              <button type="button" onClick={() => void toggleFollow(selectedUser)}>
                {selectedUser.followingByMe ? "Отписаться" : "Подписаться"}
              </button>
            ) : null}
            <h3>Достижения</h3>
            <ul>
              {selectedUser.achievements.map((achievement) => (
                <li key={achievement.id}>{achievement.title}</li>
              ))}
            </ul>
            <h3>Посты</h3>
            {posts.map((post) => (
              <article className="app-page__panel" key={post.id}>
                <strong>{post.type}</strong>
                <p>{post.text}</p>
                <small>
                  Лайки: {post.likesCount} / Комментарии: {post.commentsCount} / Репосты:{" "}
                  {post.repostsCount}
                </small>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
