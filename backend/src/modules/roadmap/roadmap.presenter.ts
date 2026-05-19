type RoadmapStepWithProgress = {
  id: string;
  title: string;
  description: string;
  order: number;
  content: string;
  checklist: unknown;
  quiz: unknown;
  pointsReward: number;
  userProgress: Array<{
    status: "locked" | "available" | "completed";
    completedAt: Date | null;
  }>;
};

type RoadmapQuizQuestion = {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  correctOptionId: string;
};

function isRoadmapQuiz(value: unknown): value is RoadmapQuizQuestion[] {
  return Array.isArray(value);
}

function toPublicQuiz(quiz: unknown) {
  if (!isRoadmapQuiz(quiz)) {
    return [];
  }

  return quiz.map((question) => ({
    id: question.id,
    question: question.question,
    options: question.options,
  }));
}

export function toPublicRoadmapStep(step: RoadmapStepWithProgress) {
  const progress = step.userProgress[0];

  return {
    id: step.id,
    title: step.title,
    description: step.description,
    order: step.order,
    status: progress?.status ?? "locked",
    completedAt: progress?.completedAt?.toISOString() ?? null,
    pointsReward: step.pointsReward,
  };
}

export function toPublicRoadmapLesson(step: RoadmapStepWithProgress) {
  return {
    ...toPublicRoadmapStep(step),
    content: step.content,
    checklist: step.checklist,
    quiz: toPublicQuiz(step.quiz),
  };
}
