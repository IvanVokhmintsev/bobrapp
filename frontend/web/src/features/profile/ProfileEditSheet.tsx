import { useState } from "react";

import { api, type ApiUser, type ProfileType } from "../../api";
import { AvatarPicker } from "./AvatarPicker";

type ProfileEditSheetProps = {
  user: ApiUser;
  onClose: () => void;
  onSaved: (user: ApiUser) => void;
};

export function ProfileEditSheet(props: ProfileEditSheetProps) {
  const profile = props.user.musicianProfile;
  const [user, setUser] = useState(props.user);
  const [name, setName] = useState(props.user.name);
  const [profileType, setProfileType] = useState<ProfileType>(profile?.profileType ?? "solo");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [genres, setGenres] = useState(profile?.genres.join(", ") ?? "");
  const [instruments, setInstruments] = useState(profile?.instruments.join(", ") ?? "");
  const [daw, setDaw] = useState(profile?.daw.join(", ") ?? "");
  const [memberNames, setMemberNames] = useState(profile?.memberNames.join(", ") ?? "");
  const [socialLinks, setSocialLinks] = useState(
    Object.entries(profile?.socialLinks ?? {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n"),
  );
  const [acceptsProposals, setAcceptsProposals] = useState(
    profile?.acceptsProposals ?? true,
  );
  const [error, setError] = useState("");

  function handleAvatarUpdated(nextUser: ApiUser) {
    setUser(nextUser);
    props.onSaved(nextUser);
  }

  async function save() {
    try {
      setError("");
      const result = await api.updateProfile({
        name,
        profileType,
        bio,
        location,
        genres: splitList(genres),
        instruments: profileType === "solo" ? splitList(instruments) : [],
        daw: profileType === "solo" ? splitList(daw) : [],
        memberNames: profileType === "band" ? splitList(memberNames) : [],
        socialLinks: parseSocialLinks(socialLinks),
        acceptsProposals,
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
        <div className="profile-edit__header">
          <h2>Редактировать профиль</h2>
          <button type="button" onClick={props.onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <div className="profile-edit__body">
          <AvatarPicker user={user} showActions onUpdated={handleAvatarUpdated} />
          <fieldset className="profile-edit__type">
            <legend>Тип профиля</legend>
            <label>
              <input
                type="radio"
                name="profileType"
                value="solo"
                checked={profileType === "solo"}
                onChange={() => setProfileType("solo")}
              />
              Соло-музыкант
            </label>
            <label>
              <input
                type="radio"
                name="profileType"
                value="band"
                checked={profileType === "band"}
                onChange={() => setProfileType("band")}
              />
              Группа
            </label>
          </fieldset>
          <label>
            {profileType === "band" ? "Название группы" : "Имя"}
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            {profileType === "band" ? "О группе" : "О себе"}
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} />
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
          {profileType === "solo" ? (
            <>
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
            </>
          ) : (
            <label>
              Состав (через запятую)
              <input
                value={memberNames}
                onChange={(event) => setMemberNames(event.target.value)}
                placeholder="Аня — вокал, Макс — гитара"
              />
            </label>
          )}
          <label>
            Соцсети (ключ: ссылка)
            <textarea
              value={socialLinks}
              onChange={(event) => setSocialLinks(event.target.value)}
              rows={3}
            />
          </label>
          <label className="profile-edit__checkbox">
            <input
              type="checkbox"
              checked={acceptsProposals}
              onChange={(event) => setAcceptsProposals(event.target.checked)}
            />
            Принимать предложения о сотрудничестве через платформу
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
