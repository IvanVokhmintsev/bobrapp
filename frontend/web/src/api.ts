export type UserRole = "musician" | "label";
export type MusicianLevel = "nothing" | "beginner" | "advanced" | "professional";
export type PostType = "professional" | "roadmap";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  musicianProfile: null | {
    id: string;
    level: MusicianLevel | null;
    bio: string | null;
    avatarUrl: string | null;
    points: number;
    roadmapProgress: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string | null;
    type: "roadmap" | "professional";
    createdAt: string;
  }>;
};

export type ApiPost = {
  id: string;
  text: string;
  type: PostType;
  likesCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: UserRole;
    avatarUrl: string | null;
  };
};

export type RoadmapStep = {
  id: string;
  title: string;
  description: string;
  order: number;
  status: "locked" | "available" | "completed";
  pointsReward: number;
  completedAt: string | null;
};

export type RoadmapLesson = RoadmapStep & {
  content: string;
  checklist: string[];
  quiz: Array<{
    id: string;
    question: string;
    options: Array<{
      id: string;
      text: string;
    }>;
  }>;
};

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request<T>(
  path: string,
  options: RequestInit = {},
  token: string | null = null,
): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = (await response.json()) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }

  return data;
}

export const api = {
  register(input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    return request<{ token: string; user: ApiUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  login(input: { email: string; password: string }) {
    return request<{ token: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  me(token: string) {
    return request<{ user: ApiUser }>("/auth/me", {}, token);
  },
  onboardMusician(token: string, level: MusicianLevel) {
    return request<{ user: ApiUser }>(
      "/onboarding/musician",
      {
        method: "POST",
        body: JSON.stringify({ level }),
      },
      token,
    );
  },
  getProfile(token: string) {
    return request<{ user: ApiUser }>("/profile/me", {}, token);
  },
  updateProfile(
    token: string,
    input: { name?: string; bio?: string; avatarUrl?: string },
  ) {
    return request<{ user: ApiUser }>(
      "/profile/me",
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
      token,
    );
  },
  getPosts(token: string) {
    return request<{ posts: ApiPost[] }>("/posts", {}, token);
  },
  createPost(token: string, input: { text: string; type: PostType }) {
    return request<{ post: ApiPost }>(
      "/posts",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token,
    );
  },
  likePost(token: string, id: string) {
    return request<{ post: ApiPost }>(
      `/posts/${id}/like`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      token,
    );
  },
  getRoadmap(token: string) {
    return request<{ steps: RoadmapStep[] }>("/roadmap", {}, token);
  },
  getLesson(token: string, stepId: string) {
    return request<{ step: RoadmapLesson }>(
      `/roadmap/${stepId}/lesson`,
      {},
      token,
    );
  },
  submitQuiz(
    token: string,
    stepId: string,
    answers: Array<{ questionId: string; optionId: string }>,
  ) {
    return request<{
      passed: boolean;
      wrongQuestionIds: string[];
      steps: RoadmapStep[];
    }>(
      `/roadmap/${stepId}/quiz`,
      {
        method: "POST",
        body: JSON.stringify({ answers }),
      },
      token,
    );
  },
};
