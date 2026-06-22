import { useEffect, useState } from "react";

import { api, type RoadmapLesson, type RoadmapStep } from "../../api";
import "./roadmap.css";

export function RoadmapScreen() {
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [lesson, setLesson] = useState<RoadmapLesson | null>(null);
  const [checkedIndices, setCheckedIndices] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);

  async function loadRoadmap() {
    const result = await api.getRoadmap();
    setSteps(result.steps);
  }

  useEffect(() => {
    void loadRoadmap();
  }, []);

  async function openLesson(stepId: string) {
    setError("");
    const result = await api.getLesson(stepId);
    setLesson(result.step);
    setCheckedIndices(result.step.checklistChecked);
    setAnswers({});
  }

  async function toggleChecklistItem(index: number) {
    if (!lesson) {
      return;
    }

    const nextChecked = checkedIndices.includes(index)
      ? checkedIndices.filter((item) => item !== index)
      : [...checkedIndices, index].sort((left, right) => left - right);

    setCheckedIndices(nextChecked);
    setIsSavingChecklist(true);

    try {
      const result = await api.updateChecklist(lesson.id, nextChecked);
      setLesson(result.step);
      setCheckedIndices(result.step.checklistChecked);
    } catch {
      setCheckedIndices(checkedIndices);
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
      setError(caught instanceof Error ? caught.message : "Quiz failed");
    }
  }

  const checklistProgress =
    lesson && lesson.checklist.length > 0
      ? Math.round((checkedIndices.length / lesson.checklist.length) * 100)
      : 0;

  return (
    <main className="app-page roadmap-page">
      <h1>Roadmap</h1>
      <p className="app-page__intro">Проходите этапы, открывайте уроки и зарабатывайте очки.</p>

      <div className="roadmap-page__steps">
        {steps.map((step) => (
          <article
            className={`roadmap-step app-page__panel ${
              step.status === "available"
                ? "is-current"
                : step.status === "completed"
                  ? "is-completed"
                  : ""
            }`}
            key={step.id}
          >
            <div className="roadmap-step__head">
              <strong>
                {step.order}. {step.title}
              </strong>
              <span className={`roadmap-step__status roadmap-step__status--${step.status}`}>
                {stepStatusLabel(step.status)}
              </span>
            </div>
            <p>{step.description}</p>
            <button
              type="button"
              disabled={step.status === "locked"}
              onClick={() => void openLesson(step.id)}
            >
              Открыть урок
            </button>
          </article>
        ))}
      </div>

      {lesson ? (
        <section className="roadmap-lesson app-page__panel">
          <h2>{lesson.title}</h2>
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
            Отправить ответы
          </button>
        </section>
      ) : null}
    </main>
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
