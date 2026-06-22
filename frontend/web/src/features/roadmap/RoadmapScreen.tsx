import { useEffect, useState } from "react";

import { api, type RoadmapLesson, type RoadmapStep } from "../../api";

export function RoadmapScreen() {
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [lesson, setLesson] = useState<RoadmapLesson | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

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
    setAnswers({});
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

  return (
    <main className="app-page">
      <h1>Roadmap</h1>
      <p className="app-page__intro">Проходите этапы, открывайте уроки и зарабатывайте очки.</p>

      {steps.map((step) => (
        <article className="app-page__panel" key={step.id}>
          <strong>
            {step.order}. {step.title}
          </strong>
          <p>{step.description}</p>
          <p>Статус: {step.status}</p>
          <button
            type="button"
            disabled={step.status === "locked"}
            onClick={() => void openLesson(step.id)}
          >
            Открыть урок
          </button>
        </article>
      ))}

      {lesson ? (
        <section className="app-page__panel">
          <h2>{lesson.title}</h2>
          <p>{lesson.content}</p>
          <ul>
            {lesson.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {lesson.quiz.map((question) => (
            <fieldset key={question.id}>
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
