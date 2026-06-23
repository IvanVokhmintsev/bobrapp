import { useState } from "react";

import { api, type ApiUser, type ProfileType } from "../../api";
import { normalizeGenres } from "../../lib/musicGenres";
import { normalizeMembers, resolveProfileMembers } from "../../lib/profileMembers";
import {
  socialLinksFromRecord,
  socialLinksToRecord,
} from "../../lib/socialPlatforms";
import { AvatarPicker } from "./AvatarPicker";
import { ProfileGenrePicker } from "./edit/ProfileGenrePicker";
import { ProfileSegmentedControl, ProfileToggle } from "./edit/ProfileFormControls";
import { ProfileMembersEditor } from "./edit/ProfileMembersEditor";
import { ProfileSocialLinksEditor } from "./edit/ProfileSocialLinksEditor";
import "./profile-edit-form.css";

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
  const [genres, setGenres] = useState(profile?.genres ?? []);
  const [instruments, setInstruments] = useState(profile?.instruments.join(", ") ?? "");
  const [daw, setDaw] = useState(profile?.daw.join(", ") ?? "");
  const [members, setMembers] = useState(() =>
    resolveProfileMembers(profile?.members, profile?.memberNames),
  );
  const [socialEntries, setSocialEntries] = useState(() =>
    socialLinksFromRecord(profile?.socialLinks ?? {}),
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
      const normalizedMembers = profileType === "band" ? normalizeMembers(members) : [];

      const result = await api.updateProfile({
        name,
        profileType,
        bio,
        location,
        genres: normalizeGenres(genres),
        instruments: profileType === "solo" ? splitList(instruments) : [],
        daw: profileType === "solo" ? splitList(daw) : [],
        members: normalizedMembers,
        socialLinks: socialLinksToRecord(socialEntries),
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

          <ProfileSegmentedControl
            label="Тип профиля"
            value={profileType}
            onChange={setProfileType}
            options={[
              {
                value: "solo",
                label: "Соло-музыкант",
                description: "Один артист и свой roadmap",
              },
              {
                value: "band",
                label: "Группа",
                description: "Коллектив с составом",
              },
            ]}
          />

          <label className="profile-form-field">
            <span className="profile-form-field__label">
              {profileType === "band" ? "Название группы" : "Имя"}
            </span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label className="profile-form-field">
            <span className="profile-form-field__label">
              {profileType === "band" ? "О группе" : "О себе"}
            </span>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} />
          </label>

          <label className="profile-form-field">
            <span className="profile-form-field__label">Локация</span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </label>

          <ProfileGenrePicker value={genres} onChange={setGenres} />

          {profileType === "solo" ? (
            <>
              <label className="profile-form-field">
                <span className="profile-form-field__label">Инструменты (через запятую)</span>
                <input
                  value={instruments}
                  onChange={(event) => setInstruments(event.target.value)}
                />
              </label>
              <label className="profile-form-field">
                <span className="profile-form-field__label">DAW (через запятую)</span>
                <input value={daw} onChange={(event) => setDaw(event.target.value)} />
              </label>
            </>
          ) : (
            <ProfileMembersEditor value={members} onChange={setMembers} />
          )}

          <ProfileSocialLinksEditor value={socialEntries} onChange={setSocialEntries} />

          <ProfileToggle
            label="Принимать предложения о сотрудничестве через платформу"
            checked={acceptsProposals}
            onChange={setAcceptsProposals}
          />

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
