import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api, type RoadmapStep } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { getCurrentStep, stepOrderToLevel } from "../../lib/roadmapLevels";
import { ProfileRoadmapMap } from "../profile/ProfileRoadmapMap";
import "../profile/profile.css";
import "../profile/profile-roadmap.css";
import "./roadmap-map.css";

export function RoadmapMapScreen() {
  const { user } = useAuth();
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const currentStep = useMemo(() => getCurrentStep(roadmapSteps), [roadmapSteps]);
  const roadmapProgress = user?.musicianProfile?.roadmapProgress ?? 0;

  useEffect(() => {
    void api
      .getRoadmap()
      .then((result) => {
        setRoadmapSteps(result.steps);
        setLoadError("");
      })
      .catch((caught) => {
        setRoadmapSteps([]);
        setLoadError(
          caught instanceof Error ? caught.message : "Не удалось загрузить прогресс roadmap",
        );
      });
  }, []);

  return (
    <div className="roadmap-map-page">
      <div className="roadmap-map-page__toolbar">
        <Link className="roadmap-map-page__back" to="/profile">
          ← Профиль
        </Link>
        <div className="roadmap-map-page__meta">
          <span className="roadmap-map-page__progress">Прогресс: {roadmapProgress}%</span>
          {currentStep ? (
            <span className="roadmap-map-page__current">
              Текущий этап: {currentStep.order}. {currentStep.title}
            </span>
          ) : null}
        </div>
        <div className="roadmap-map-page__links">
          {currentStep ? (
            <Link to={`/roadmap?step=${currentStep.id}`}>Открыть текущий урок</Link>
          ) : null}
          <Link to="/roadmap">Все этапы</Link>
        </div>
      </div>

      {loadError ? <p className="app-page__error">{loadError}</p> : null}

      <p className="roadmap-map-page__hint">
        Карта показывает уровни. Отмечать чек-лист и завершать этап можно только в уроке.
      </p>

      <div className="roadmap-map-page__panel">
        {selectedLevel === null ? (
          <ProfileRoadmapMap steps={roadmapSteps} onSelectLevel={setSelectedLevel} />
        ) : (
          <RoadmapLevelDetail
            level={selectedLevel}
            steps={roadmapSteps}
            onBack={() => setSelectedLevel(null)}
          />
        )}
      </div>
    </div>
  );
}

function RoadmapLevelDetail(props: {
  level: number;
  steps: RoadmapStep[];
  onBack: () => void;
}) {
  const milestones = buildMilestones(props.steps, props.level);

  return (
    <section className="profile-roadmap-detail roadmap-map-page__detail">
      <button type="button" className="profile-roadmap-detail__back" onClick={props.onBack}>
        ‹ Уровень {props.level}
      </button>

      {milestones.length === 0 ? (
        <p className="roadmap-map-page__hint">На этом уровне нет этапов roadmap.</p>
      ) : (
        <div className="profile-roadmap-detail__list">
          {milestones.map((milestone) => (
            <article
              className={`profile-milestone ${milestone.completed ? "is-completed" : ""} ${
                milestone.status === "available" ? "is-current" : ""
              }`}
              key={milestone.id}
            >
              <span aria-hidden="true">⚙</span>
              <div className="profile-milestone__body">
                <p>{milestone.title}</p>
                <span className={`roadmap-step__status roadmap-step__status--${milestone.status}`}>
                  {milestoneStatusLabel(milestone.status)}
                </span>
                {milestone.status !== "locked" ? (
                  <Link className="profile-milestone__action" to={`/roadmap?step=${milestone.id}`}>
                    {milestone.status === "available"
                      ? "Открыть урок и отметить чек-лист"
                      : "Повторить урок"}
                  </Link>
                ) : (
                  <span className="profile-milestone__locked">Откроется после предыдущих этапов</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

type MilestoneItem = {
  id: string;
  title: string;
  completed: boolean;
  status: RoadmapStep["status"];
};

function buildMilestones(steps: RoadmapStep[], level: number): MilestoneItem[] {
  if (steps.length === 0) {
    return [];
  }

  return steps
    .filter((step) => stepOrderToLevel(step.order) === level)
    .map((step) => ({
      id: step.id,
      title: `${step.order}. ${step.title}: ${step.description}`,
      completed: step.status === "completed",
      status: step.status,
    }));
}

function milestoneStatusLabel(status: RoadmapStep["status"]) {
  switch (status) {
    case "available":
      return "Текущий";
    case "completed":
      return "Пройден";
    default:
      return "Закрыт";
  }
}
