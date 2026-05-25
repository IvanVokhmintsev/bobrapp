import { useState } from "react";

import { api, type ApiUser } from "../../api";

type ProfileEditSheetProps = {
  token: string;
  user: ApiUser;
  onClose: () => void;
  onSaved: (user: ApiUser) => void;
};

export function ProfileEditSheet(props: ProfileEditSheetProps) {
  const profile = props.user.musicianProfile;
  const [name, setName] = useState(props.user.name);
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [genres, setGenres] = useState(profile?.genres.join(", ") ?? "");
  const [instruments, setInstruments] = useState(profile?.instruments.join(", ") ?? "");
  const [daw, setDaw] = useState(profile?.daw.join(", ") ?? "");
  const [socialLinks, setSocialLinks] = useState(
    Object.entries(profile?.socialLinks ?? {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n"),
  );
  const [error, setError] = useState("");

  async function save() {
    try {
      setError("");
      const result = await api.updateProfile(props.token, {
        name,
        bio,
        avatarUrl,
        location,
        genres: splitList(genres),
        instruments: splitList(instruments),
        daw: splitList(daw),
        socialLinks: parseSocialLinks(socialLinks),
      });
      props.onSaved(result.user);
      props.onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить");
    }
  }

  return (
    <div className="profile-edit" role="dialog" aria-label="Редактирование профиля">
      <div className="profile-edit__backdrop" onClick={props.onClose} />
      <section className="profile-edit__panel">
        <header className="profile-edit__header">
          <h2>Редактировать профиль</h2>
          <button type="button" onClick={props.onClose} aria-label="Закрыть">
            ×
          </button>
        </header>
        <div className="profile-edit__body">
          <label>
            Имя
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            О себе
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} />
          </label>
          <label>
            URL аватара
            <input
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
            />
          </label>
          <label>
            Локация
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </label>
          <label>
            Жанры (через запятую)
            <input value={genres} onChange={(event) => setGenres(event.target.value)} />
          </label>
          <label>
            Инструменты (через запятую)
            <input
              value={instruments}
              onChange={(event) => setInstruments(event.target.value)}
            />
          </label>
          <label>
            DAW (через запятую)
            <input value={daw} onChange={(event) => setDaw(event.target.value)} />
          </label>
          <label>
            Соцсети (ключ: ссылка)
            <textarea
              value={socialLinks}
              onChange={(event) => setSocialLinks(event.target.value)}
              rows={3}
            />
          </label>
          {error ? <p className="profile-edit__error">{error}</p> : null}
        </div>
        <footer className="profile-edit__footer">
          <button type="button" className="profile-edit__save" onClick={() => void save()}>
            Сохранить
          </button>
        </footer>
      </section>
    </div>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSocialLinks(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((links, item) => {
      const [key, ...rest] = item.split(":");
      const link = rest.join(":").trim();
      if (key && link) {
        links[key.trim()] = link;
      }
      return links;
    }, {});
}
