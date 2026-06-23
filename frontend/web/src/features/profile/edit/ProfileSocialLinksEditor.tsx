import {
  createSocialLinkEntry,
  SOCIAL_PLATFORMS,
  type SocialLinkEntry,
} from "../../../lib/socialPlatforms";

type ProfileSocialLinksEditorProps = {
  value: SocialLinkEntry[];
  onChange: (entries: SocialLinkEntry[]) => void;
  label?: string;
};

export function ProfileSocialLinksEditor(props: ProfileSocialLinksEditorProps) {
  const entries = props.value.length ? props.value : [createSocialLinkEntry()];

  function updateEntry(id: string, patch: Partial<SocialLinkEntry>) {
    props.onChange(
      entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  }

  function removeEntry(id: string) {
    const next = entries.filter((entry) => entry.id !== id);
    props.onChange(next.length ? next : [createSocialLinkEntry()]);
  }

  function addEntry() {
    if (entries.length >= 20) {
      return;
    }

    const usedPlatforms = new Set(entries.map((entry) => entry.platform));
    const nextPlatform =
      SOCIAL_PLATFORMS.find((platform) => !usedPlatforms.has(platform.id))?.id ?? "";

    props.onChange([...entries, createSocialLinkEntry(nextPlatform)]);
  }

  return (
    <div className="profile-form-field">
      <span className="profile-form-field__label">{props.label ?? "Соцсети и ссылки"}</span>
      <div className="profile-social-editor">
        {entries.map((entry, index) => (
          <div className="profile-social-editor__row" key={entry.id}>
            <select
              value={entry.platform}
              onChange={(event) => updateEntry(entry.id, { platform: event.target.value })}
              aria-label={`Платформа ${index + 1}`}
            >
              <option value="">Платформа</option>
              {SOCIAL_PLATFORMS.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.label}
                </option>
              ))}
            </select>
            <input
              value={entry.url}
              onChange={(event) => updateEntry(entry.id, { url: event.target.value })}
              placeholder="https://"
              aria-label={`Ссылка ${index + 1}`}
              maxLength={500}
            />
            <button
              type="button"
              className="profile-social-editor__remove"
              aria-label={`Удалить ссылку ${index + 1}`}
              onClick={() => removeEntry(entry.id)}
              disabled={entries.length === 1 && !entry.platform && !entry.url}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="profile-form-add"
          onClick={addEntry}
          disabled={entries.length >= 20}
        >
          + Добавить ссылку
        </button>
      </div>
    </div>
  );
}
