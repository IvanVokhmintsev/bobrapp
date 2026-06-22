import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api, type RoadmapStep } from "../../api";
import { ProfileRoadmapMap } from "../profile/ProfileRoadmapMap";
import "../profile/profile.css";
import "../profile/profile-roadmap.css";
import "./roadmap-map.css";

const guideCards = [
  {
    title: "Как вырастить концерт с 100 до 1000 зрителей?",
    body: "Переход от локального выступления к крупному событию требует другой стратегии продвижения и мышления.",
    author: "И. Иванов",
  },
  {
    title: "Как собрать сильный каталог релизов?",
    body: "Планируйте релизы сериями, держите единый визуальный язык и регулярно возвращайтесь к аналитике.",
    author: "И. Иванов",
  },
];

export function RoadmapMapScreen() {
  const [roadmapSteps, setRoadmapSteps] = useState<RoadmapStep[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  useEffect(() => {
    void api
      .getRoadmap()
      .then((result) => setRoadmapSteps(result.steps))
      .catch(() => setRoadmapSteps([]));
  }, []);

  return (
    <div className="roadmap-map-page">
      <div className="roadmap-map-page__toolbar">
        <Link className="roadmap-map-page__back" to="/profile">
          ← Профиль
        </Link>
        <div className="roadmap-map-page__links">
          <Link to="/roadmap">Уроки roadmap</Link>
        </div>
      </div>

      <div className="roadmap-map-page__panel">
        {selectedLevel === null ? (
          <ProfileRoadmapMap onSelectLevel={setSelectedLevel} />
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

      <div className="profile-roadmap-detail__list">
        {milestones.map((milestone) => (
          <article
            className={`profile-milestone ${milestone.completed ? "is-completed" : ""}`}
            key={milestone.id}
          >
            <span aria-hidden="true">⚙</span>
            <p>{milestone.title}</p>
          </article>
        ))}
      </div>

      <h2>Гайды и статьи по этапу:</h2>
      <div className="profile-guides">
        {guideCards.map((guide) => (
          <article className="profile-guide" key={guide.title}>
            <div>
              <h3>{guide.title}</h3>
              <p>{guide.body}</p>
              <span>{guide.author}</span>
            </div>
            <strong aria-hidden="true">›</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function buildMilestones(steps: RoadmapStep[], level: number) {
  const fallback = [
    "Майлстоун «Сильный каталог»: Более трёх альбомов записано и релизнуто",
    "Майлстоун «Стабильные концерты»: Собран регулярный концертный график",
    "Майлстоун «Промо»: Оформлены материалы для продвижения релиза",
    "Майлстоун «Команда»: Распределены роли и зона ответственности",
    "Майлстоун «Аудитория»: Появился устойчивый канал коммуникации",
    "Майлстоун «Сцена»: Подготовлена программа для выступления",
    "Майлстоун «Аналитика»: Зафиксированы цели следующего этапа",
  ];

  if (steps.length === 0) {
    return fallback.map((title, index) => ({
      id: `${level}-${index}`,
      title,
      completed: index < 5,
    }));
  }

  return steps.slice(0, 7).map((step, index) => ({
    id: step.id,
    title: `Майлстоун «${step.title}»: ${step.description}`,
    completed: step.status === "completed" || index < Math.max(1, 9 - level),
  }));
}
