import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type MusicianLevel, type ProfileType } from "../../api";
import { useAuth } from "../../context/AuthContext";
import "./onboarding.css";

const levels: Array<{ value: MusicianLevel; label: string }> = [
  { value: "nothing", label: "Почти ничего не знаю" },
  { value: "beginner", label: "Новичок" },
  { value: "advanced", label: "Уверенно занимаюсь музыкой" },
  { value: "professional", label: "Профессионально занимаюсь музыкой" },
];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [step, setStep] = useState<"type" | "level">("type");
  const [profileType, setProfileType] = useState<ProfileType>("solo");
  const [memberNames, setMemberNames] = useState("");
  const [error, setError] = useState("");

  async function chooseLevel(level: MusicianLevel) {
    try {
      setError("");
      const result = await api.onboardMusician({
        level,
        profileType,
        memberNames:
          profileType === "band"
            ? memberNames
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
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
        {step === "type" ? (
          <>
            <h1>Кто вы?</h1>
            <p className="app-page__intro">
              Выберите тип профиля. Его можно изменить позже в настройках.
            </p>
            <div className="onboarding-type-grid">
              <button
                type="button"
                className={`onboarding-type-card ${profileType === "solo" ? "is-selected" : ""}`}
                onClick={() => setProfileType("solo")}
              >
                <strong>Соло-музыкант</strong>
                <span>Один артист, свой инструмент и roadmap</span>
              </button>
              <button
                type="button"
                className={`onboarding-type-card ${profileType === "band" ? "is-selected" : ""}`}
                onClick={() => setProfileType("band")}
              >
                <strong>Группа</strong>
                <span>Коллектив с составом и общим профилем</span>
              </button>
            </div>
            {profileType === "band" ? (
              <label className="onboarding-members">
                Состав (через запятую)
                <input
                  value={memberNames}
                  onChange={(event) => setMemberNames(event.target.value)}
                  placeholder="Аня — вокал, Макс — гитара"
                />
              </label>
            ) : null}
            <div className="app-page__actions">
              <button
                type="button"
                className="app-button app-button--primary"
                onClick={() => setStep("level")}
              >
                Дальше
              </button>
            </div>
          </>
        ) : (
          <>
            <button type="button" className="onboarding-back" onClick={() => setStep("type")}>
              ← Назад
            </button>
            <h1>Выбери уровень</h1>
            <p className="app-page__intro">
              Это поможет подобрать стартовый roadmap и рекомендации в ленте.
            </p>
            <div className="app-page__actions">
              {levels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  className="app-button app-button--primary"
                  onClick={() => void chooseLevel(level.value)}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </>
        )}
        {error ? <p className="app-page__error">{error}</p> : null}
      </main>
    </div>
  );
}
