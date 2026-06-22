import { useNavigate } from "react-router-dom";

import { api, type MusicianLevel } from "../../api";
import { useAuth } from "../../context/AuthContext";

const levels: Array<{ value: MusicianLevel; label: string }> = [
  { value: "nothing", label: "Почти ничего не знаю" },
  { value: "beginner", label: "Новичок" },
  { value: "advanced", label: "Уверенно занимаюсь музыкой" },
  { value: "professional", label: "Профессионально занимаюсь музыкой" },
];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function choose(level: MusicianLevel) {
    const result = await api.onboardMusician(level);
    setUser(result.user);
    navigate("/feed", { replace: true });
  }

  return (
    <div className="app-shell-root">
      <main className="app-page app-page--onboarding">
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
              onClick={() => void choose(level.value)}
            >
              {level.label}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
