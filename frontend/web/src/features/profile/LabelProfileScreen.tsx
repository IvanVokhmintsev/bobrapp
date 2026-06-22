import { useState } from "react";
import { Link } from "react-router-dom";

import { api, type ApiUser } from "../../api";
import "./label-profile.css";

type LabelProfileScreenProps = {
  user: ApiUser;
  onSaved: (user: ApiUser) => void;
};

export function LabelProfileScreen(props: LabelProfileScreenProps) {
  const [companyName, setCompanyName] = useState(props.user.labelProfile?.companyName ?? "");
  const [description, setDescription] = useState(props.user.labelProfile?.description ?? "");
  const [genres, setGenres] = useState((props.user.labelProfile?.genres ?? []).join(", "));
  const [contactName, setContactName] = useState(props.user.name);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    try {
      setIsSaving(true);
      setError("");
      const result = await api.updateProfile({
        name: contactName.trim(),
        companyName: companyName.trim(),
        bio: description.trim(),
        genres: genres
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      props.onSaved(result.user);
      setNotice("Профиль лейбла обновлён");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось сохранить профиль");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="app-page label-profile-page">
      <h1>Профиль лейбла</h1>
      <p className="app-page__intro">
        Здесь данные вашей компании. Для оценки артистов используйте ленту, каталог музыкантов и
        избранное.{" "}
        <Link to="/proposals">Отправленные предложения</Link> — в отдельном разделе навигации.
      </p>

      <section className="label-profile-page__panel app-page__panel">
        <label className="label-profile-page__field">
          Контактное имя
          <input value={contactName} onChange={(event) => setContactName(event.target.value)} />
        </label>
        <label className="label-profile-page__field">
          Название компании
          <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
        </label>
        <label className="label-profile-page__field">
          Описание
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
          />
        </label>
        <label className="label-profile-page__field">
          Жанры (через запятую)
          <input value={genres} onChange={(event) => setGenres(event.target.value)} />
        </label>

        {error ? <p className="app-page__error">{error}</p> : null}
        {notice ? <p className="app-page__hint">{notice}</p> : null}

        <button type="button" className="app-button app-button--primary" disabled={isSaving} onClick={() => void save()}>
          {isSaving ? "Сохранение…" : "Сохранить"}
        </button>
      </section>
    </main>
  );
}
