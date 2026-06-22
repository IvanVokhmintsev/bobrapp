import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { api, type RoadmapLesson, type RoadmapStep } from "../../api";
import { getCurrentStep } from "../../lib/roadmapLevels";
import "./roadmap.css";

export function RoadmapScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [lesson, setLesson] = useState<RoadmapLesson | null>(null);
  const [checkedIndices, setCheckedIndices] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);

  const currentStep = useMemo(() => getCurrentStep(steps), [steps]);
  const completedSteps = useMemo(
    () => steps.filter((step) => step.status === "completed"),
    [steps],
  );
  const lockedSteps = useMemo(
    () => steps.filter((step) => step.status === "locked"),
    [steps],
  );

  async function loadRoadmap() {
    setIsLoading(true);
    setLoadError("");

    try {
      const result = await api.getRoadmap();
      setSteps(result.steps);
    } catch (caught) {
      setSteps([]);
      setLoadError(
        caught instanceof Error
          ? caught.message
          : "Не удалось загрузить roadmap. Нужна роль musician и запущенный backend.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRoadmap();
  }, []);

  async function openLesson(stepId: string) {
    setError("");
    setLoadError("");

    try {
      const result = await api.getLesson(stepId);
      setLesson(result.step);
      setCheckedIndices(result.step.checklistChecked);
      setAnswers({});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось открыть урок");
    }
  }

  useEffect(() => {
    const stepId = searchParams.get("step");

    if (!stepId || steps.length === 0) {
      return;
    }

    const step = steps.find((item) => item.id === stepId);

    if (!step || step.status === "locked") {
      return;
    }

    void openLesson(stepId);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, steps]);

  async function toggleChecklistItem(index: number) {
    if (!lesson) {
      return;
    }

    const previousChecked = checkedIndices;
    const nextChecked = previousChecked.includes(index)
      ? previousChecked.filter((item) => item !== index)
      : [...previousChecked, index].sort((left, right) => left - right);

    setCheckedIndices(nextChecked);
    setIsSavingChecklist(true);
    setError("");

    try {
      const result = await api.updateChecklist(lesson.id, nextChecked);
      setLesson(result.step);
      setCheckedIndices(result.step.checklistChecked);
    } catch (caught) {
      setCheckedIndices(previousChecked);
      setError(
        caught instanceof Error
          ? caught.message
          : "Не удалось сохранить чек-лист. Проверьте миграции backend.",
      );
    } finally {
      setIsSavingChecklist(false);
    }
  }

  async function submitQuiz() {
    if (!lesson) {
      return;
    }

    try {
      const result = await api.submitQuiz(
        lesson.id,
        Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
      );
      setSteps(result.steps);
      setLesson(null);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось отправить ответы");
    }
  }

  const checklistProgress =
    lesson && lesson.checklist.length > 0
      ? Math.round((checkedIndices.length / lesson.checklist.length) * 100)
      : 0;

  return (
    <main className="app-page roadmap-page">
      <div className="roadmap-page__head">
        <div>
          <h1>Roadmap</h1>
          <p className="app-page__intro">
            Здесь проходят этапы: чек-лист и квиз в уроке. Карта — только обзор.
          </p>
        </div>
        <Link className="roadmap-page__map-link" to="/roadmap/map">
          Карта развития
        </Link>
      </div>

      {isLoading ? <p className="app-page__hint">Загрузка этапов…</p> : null}
      {loadError ? <p className="app-page__error">{loadError}</p> : null}

      {!isLoading && steps.length === 0 && !loadError ? (
        <p className="app-page__hint">
          Этапы не найдены. Запустите seed: <code>cd backend && pnpm prisma:seed</code>
        </p>
      ) : null}

      {currentStep ? (
        <article className="roadmap-step roadmap-step--hero app-page__panel is-current">
          <div className="roadmap-step__head">
            <strong>
              Текущий этап {currentStep.order}: {currentStep.title}
            </strong>
            <span className="roadmap-step__status roadmap-step__status--available">Текущий</span>
          </div>
          <p>{currentStep.description}</p>
          <button type="button" onClick={() => void openLesson(currentStep.id)}>
            Открыть урок и отметить чек-лист
          </button>
        </article>
      ) : null}

      {completedSteps.length > 0 ? (
        <section className="roadmap-page__section">
          <h2 className="roadmap-page__section-title">Пройденные этапы</h2>
          <div className="roadmap-page__steps">
            {completedSteps.map((step) => (
              <RoadmapStepCard
                key={step.id}
                step={step}
                onOpen={() => void openLesson(step.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {lockedSteps.length > 0 ? (
        <section className="roadmap-page__section">
          <h2 className="roadmap-page__section-title">Будущие этапы</h2>
          <div className="roadmap-page__steps">
            {lockedSteps.map((step) => (
              <RoadmapStepCard key={step.id} step={step} onOpen={() => void openLesson(step.id)} />
            ))}
          </div>
        </section>
      ) : null}

      {lesson ? (
        <section className="roadmap-lesson app-page__panel">
          <div className="roadmap-lesson__head">
            <h2>{lesson.title}</h2>
            <button type="button" className="roadmap-lesson__close" onClick={() => setLesson(null)}>
              Закрыть
            </button>
          </div>
          <p>{lesson.content}</p>

          <div className="roadmap-checklist">
            <div className="roadmap-checklist__head">
              <h3>Чек-лист этапа</h3>
              <span>{checklistProgress}%</span>
            </div>
            <ul className="roadmap-checklist__list">
              {lesson.checklist.map((item, index) => (
                <li key={item}>
                  <label className="roadmap-checklist__item">
                    <input
                      type="checkbox"
                      checked={checkedIndices.includes(index)}
                      disabled={isSavingChecklist}
                      onChange={() => void toggleChecklistItem(index)}
                    />
                    <span>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {lesson.quiz.map((question) => (
            <fieldset className="roadmap-quiz" key={question.id}>
              <legend>{question.question}</legend>
              {question.options.map((option) => (
                <label key={option.id}>
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={answers[question.id] === option.id}
                    onChange={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: option.id,
                      }))
                    }
                  />
                  {option.text}
                </label>
              ))}
            </fieldset>
          ))}
          {error ? <p className="app-page__error">{error}</p> : null}
          <button type="button" onClick={() => void submitQuiz()}>
            Завершить этап (отправить ответы)
          </button>
        </section>
      ) : null}
    </main>
  );
}

function RoadmapStepCard(props: { step: RoadmapStep; onOpen: () => void }) {
  return (
    <article
      className={`roadmap-step app-page__panel ${
        props.step.status === "available"
          ? "is-current"
          : props.step.status === "completed"
            ? "is-completed"
            : "is-locked"
      }`}
    >
      <div className="roadmap-step__head">
        <strong>
          {props.step.order}. {props.step.title}
        </strong>
        <span className={`roadmap-step__status roadmap-step__status--${props.step.status}`}>
          {stepStatusLabel(props.step.status)}
        </span>
      </div>
      <p>{props.step.description}</p>
      <button type="button" disabled={props.step.status === "locked"} onClick={props.onOpen}>
        {props.step.status === "locked" ? "Сначала пройдите предыдущий этап" : "Открыть урок"}
      </button>
    </article>
  );
}

function stepStatusLabel(status: RoadmapStep["status"]) {
  switch (status) {
    case "available":
      return "Текущий";
    case "completed":
      return "Пройден";
    default:
      return "Закрыт";
  }
}
