import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api, type RoadmapLesson, type RoadmapLevel, type RoadmapMilestone } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { getCurrentLevel, getLevelByOrder, isLevelSelectable } from "../../lib/roadmapLevels";
import { ProfileRoadmapMap } from "../profile/ProfileRoadmapMap";
import "../profile/profile-roadmap.css";
import "./roadmap.css";

export function RoadmapScreen() {
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [levels, setLevels] = useState<RoadmapLevel[]>([]);
  const [selectedLevelOrder, setSelectedLevelOrder] = useState<number | null>(null);
  const [openMaterial, setOpenMaterial] = useState<RoadmapLesson | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMaterial, setIsLoadingMaterial] = useState(false);
  const [savingMilestoneId, setSavingMilestoneId] = useState<string | null>(null);

  const selectedLevel = useMemo(
    () => (selectedLevelOrder == null ? null : getLevelByOrder(levels, selectedLevelOrder)),
    [levels, selectedLevelOrder],
  );
  const currentLevel = useMemo(() => getCurrentLevel(levels), [levels]);
  const roadmapProgress = user?.musicianProfile?.roadmapProgress ?? 0;

  async function loadRoadmap() {
    setIsLoading(true);
    setLoadError("");

    try {
      const result = await api.getRoadmap();
      setLevels(result.levels);
      return result.levels;
    } catch (caught) {
      setLevels([]);
      setLoadError(
        caught instanceof Error
          ? caught.message
          : "Не удалось загрузить roadmap. Нужна роль musician и запущенный backend.",
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRoadmap().then((loadedLevels) => {
      const levelParam = searchParams.get("level");
      const levelOrder = levelParam ? Number(levelParam) : Number.NaN;
      const levelFromQuery = Number.isInteger(levelOrder)
        ? getLevelByOrder(loadedLevels, levelOrder)
        : null;

      if (levelFromQuery && isLevelSelectable(levelFromQuery)) {
        setSelectedLevelOrder(levelFromQuery.order);
        return;
      }

      const current = getCurrentLevel(loadedLevels);

      if (current) {
        setSelectedLevelOrder(current.order);
      }
    });
  }, [searchParams]);

  async function handleOpenMaterial(milestone: RoadmapMilestone) {
    if (milestone.status === "locked") {
      return;
    }

    setIsLoadingMaterial(true);
    setActionError("");

    try {
      const result = await api.getLesson(milestone.id);
      setOpenMaterial(result.step);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Не удалось открыть материал",
      );
    } finally {
      setIsLoadingMaterial(false);
    }
  }

  function closeMaterial() {
    setOpenMaterial(null);
    setActionError("");
  }

  async function toggleCheckpoint(milestone: RoadmapMilestone, index: number) {
    if (milestone.status === "locked") {
      return;
    }

    const checkedIndices = milestone.checkpoints
      .filter((checkpoint) => checkpoint.completed)
      .map((checkpoint) => checkpoint.index);

    const nextChecked = checkedIndices.includes(index)
      ? checkedIndices.filter((checkpointIndex) => checkpointIndex !== index)
      : [...checkedIndices, index].sort((left, right) => left - right);

    setSavingMilestoneId(milestone.id);
    setActionError("");

    try {
      const result = await api.updateChecklist(milestone.id, nextChecked);
      setLevels(result.levels);
      setActionError("");

      if (result.milestoneCompleted) {
        setNotice("Мэйлстоун пройден. Открыт следующий этап.");
        await refreshUser();
        const nextCurrent = getCurrentLevel(result.levels);

        if (nextCurrent) {
          setSelectedLevelOrder(nextCurrent.order);
        }
      }
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Не удалось сохранить чекпоинт",
      );
    } finally {
      setSavingMilestoneId(null);
    }
  }

  function handleSelectLevel(levelOrder: number) {
    setSelectedLevelOrder(levelOrder);
    setOpenMaterial(null);
    setNotice("");
  }

  return (
    <main className="app-page roadmap-workspace">
      <header className="roadmap-workspace__head">
        <div>
          <h1>Roadmap</h1>
          <p className="app-page__intro">
            Выберите уровень на карте, отметьте чекпоинты и откройте гайд справа.
          </p>
        </div>
        <div className="roadmap-workspace__meta">
          <span className="roadmap-workspace__progress">Прогресс: {roadmapProgress}%</span>
          {currentLevel ? (
            <span className="roadmap-workspace__current">Текущий: {currentLevel.title}</span>
          ) : null}
        </div>
      </header>

      {isLoading ? <p className="app-page__hint">Загрузка roadmap…</p> : null}
      {loadError ? <p className="app-page__error">{loadError}</p> : null}
      {actionError ? <p className="app-page__error">{actionError}</p> : null}
      {notice ? <p className="app-page__hint">{notice}</p> : null}

      {!isLoading && levels.length > 0 ? (
        <div className="roadmap-workspace__layout">
          <section className="roadmap-workspace__map-panel" aria-label="Карта уровней">
            <ProfileRoadmapMap
              levels={levels}
              selectedLevelOrder={selectedLevelOrder}
              onSelectLevel={handleSelectLevel}
            />
          </section>

          <aside className="roadmap-workspace__detail-panel" aria-label="Контент уровня">
            {openMaterial ? (
              <RoadmapMaterialView
                lesson={openMaterial}
                isLoading={isLoadingMaterial}
                onBack={closeMaterial}
              />
            ) : selectedLevel ? (
              <RoadmapLevelPanel
                level={selectedLevel}
                savingMilestoneId={savingMilestoneId}
                onOpenMaterial={(milestone) => void handleOpenMaterial(milestone)}
                onToggleCheckpoint={(milestone, index) =>
                  void toggleCheckpoint(milestone, index)
                }
              />
            ) : (
              <p className="roadmap-workspace__placeholder">
                Выберите доступный уровень на карте, чтобы увидеть мэйлстоуны и материалы.
              </p>
            )}
          </aside>
        </div>
      ) : null}
    </main>
  );
}

function RoadmapLevelPanel(props: {
  level: RoadmapLevel;
  savingMilestoneId: string | null;
  onOpenMaterial: (milestone: RoadmapMilestone) => void;
  onToggleCheckpoint: (milestone: RoadmapMilestone, index: number) => void;
}) {
  return (
    <div className="roadmap-level-panel">
      <div className="roadmap-level-panel__head">
        <h2>Уровень {props.level.order}</h2>
        <p>{props.level.title}</p>
        <span className={`roadmap-level-panel__status roadmap-level-panel__status--${props.level.status}`}>
          {levelStatusLabel(props.level.status)}
        </span>
      </div>

      <section className="roadmap-level-panel__milestones" aria-label="Мэйлстоуны">
        {props.level.milestones.map((milestone) => (
          <article
            key={milestone.id}
            className={`roadmap-milestone ${
              milestone.status === "completed" ? "is-completed" : ""
            } ${milestone.status === "available" ? "is-current" : ""}`}
          >
            <h3 className={milestone.status === "completed" ? "is-done" : undefined}>
              {milestone.order}. {milestone.title}
            </h3>
            <p>{milestone.description}</p>

            <ul className="roadmap-milestone__checkpoints">
              {milestone.checkpoints.map((checkpoint) => (
                <li key={checkpoint.index}>
                  <label
                    className={`roadmap-checkpoint ${
                      checkpoint.completed ? "is-completed" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checkpoint.completed}
                      disabled={
                        milestone.status !== "available" ||
                        props.savingMilestoneId === milestone.id
                      }
                      onChange={() => props.onToggleCheckpoint(milestone, checkpoint.index)}
                    />
                    <span className={checkpoint.completed ? "is-done" : undefined}>
                      {checkpoint.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            {milestone.status !== "locked" ? (
              <button
                type="button"
                className="roadmap-material-card"
                onClick={() => props.onOpenMaterial(milestone)}
              >
                <span className="roadmap-material-card__label">Гайд</span>
                <strong>{milestone.materialTitle}</strong>
              </button>
            ) : (
              <p className="roadmap-milestone__locked">Откроется после предыдущих мэйлстоунов</p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

function RoadmapMaterialView(props: {
  lesson: RoadmapLesson;
  isLoading: boolean;
  onBack: () => void;
}) {
  return (
    <article className="roadmap-material-view">
      <button type="button" className="roadmap-material-view__back" onClick={props.onBack}>
        ← Назад к уровню
      </button>
      <h2>{props.lesson.title}</h2>
      {props.isLoading ? <p className="app-page__hint">Загрузка…</p> : null}
      <div className="roadmap-material-view__content">{props.lesson.content}</div>
    </article>
  );
}

function levelStatusLabel(status: RoadmapLevel["status"]) {
  switch (status) {
    case "completed":
      return "Пройден";
    case "current":
      return "Текущий";
    default:
      return "Заблокирован";
  }
}
