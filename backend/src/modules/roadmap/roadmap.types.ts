export type RoadmapStepParams = {
  stepId: string;
};

export type RoadmapQuizBody = {
  answers: Array<{
    questionId: string;
    optionId: string;
  }>;
};

export type RoadmapChecklistBody = {
  checkedIndices: number[];
};
