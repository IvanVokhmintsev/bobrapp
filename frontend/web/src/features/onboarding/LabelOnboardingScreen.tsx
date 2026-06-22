import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import "./onboarding.css";

export function LabelOnboardingScreen() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [genres, setGenres] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    if (!companyName.trim()) {
      setError("Укажите название лейбла или продюсерского проекта");
      return;
    }

    try {
      setError("");
      const result = await api.onboardLabel({
        companyName: companyName.trim(),
        description: description.trim() || undefined,
        genres: genres
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setUser(result.user);
      navigate("/feed", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось завершить онбординг");
    }
  }

  return (
    <div className="app-shell-root">
      <main className="app-page app-page--onboarding">
        <h1>Лейбл / продюсер</h1>
        <p className="app-page__intro">
          Расскажите о себе — после этого откроются лента и каталог музыкантов для оценки артистов.
        </p>

        <label className="onboarding-members">
          Название компании
          <input
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Например, Bobr Records"
          />
        </label>

        <label className="onboarding-members">
          Описание и фокус
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Жанры, формат сотрудничества, что ищете в артистах"
            rows={4}
          />
        </label>

        <label className="onboarding-members">
          Интересующие жанры (через запятую)
          <input
            value={genres}
            onChange={(event) => setGenres(event.target.value)}
            placeholder="indie, electronic, hip-hop"
          />
        </label>

        {error ? <p className="app-page__error">{error}</p> : null}

        <div className="app-page__actions">
          <button type="button" className="app-button app-button--primary" onClick={() => void submit()}>
            Начать работу
          </button>
        </div>
      </main>
    </div>
  );
}
