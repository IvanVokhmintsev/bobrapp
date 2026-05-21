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
    location: string | null;
    genres: string[];
    instruments: string[];
    daw: string[];
    socialLinks: Record<string, string>;
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
  followersCount?: number;
  followingCount?: number;
  followingByMe?: boolean;
};

export type ApiPost = {
  id: string;
  text: string;
  type: PostType;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  likedByMe: boolean;
  repostedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    role: UserRole;
    avatarUrl: string | null;
  };
};

export type ApiComment = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    role: UserRole;
    avatarUrl: string | null;
  };
};

export type PageInfo = {
  hasNextPage: boolean;
  nextCursor: string | null;
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
  const hasBody = options.body !== undefined;

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data =
    response.status === 204
      ? (undefined as unknown as T & { error?: string })
      : ((await response.json()) as T & {
          error?: string;
        });

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
    input: {
      name?: string;
      bio?: string;
      avatarUrl?: string;
      location?: string;
      genres?: string[];
      instruments?: string[];
      daw?: string[];
      socialLinks?: Record<string, string>;
    },
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
    return request<{ posts: ApiPost[]; pageInfo: PageInfo }>("/posts", {}, token);
  },
  getProfiles(token: string, input: { q?: string; cursor?: string } = {}) {
    const params = new URLSearchParams();
    if (input.q) {
      params.set("q", input.q);
    }
    if (input.cursor) {
      params.set("cursor", input.cursor);
    }
    const query = params.toString();
    return request<{ users: ApiUser[]; pageInfo: PageInfo }>(
      `/profiles${query ? `?${query}` : ""}`,
      {},
      token,
    );
  },
  getPublicProfile(token: string, userId: string) {
    return request<{ user: ApiUser }>(`/profiles/${userId}`, {}, token);
  },
  getProfilePosts(token: string, userId: string) {
    return request<{ posts: ApiPost[]; pageInfo: PageInfo }>(
      `/profiles/${userId}/posts`,
      {},
      token,
    );
  },
  followProfile(token: string, userId: string) {
    return request<{ following: boolean }>(
      `/profiles/${userId}/follow`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      token,
    );
  },
  unfollowProfile(token: string, userId: string) {
    return request<{ following: boolean }>(
      `/profiles/${userId}/follow`,
      {
        method: "DELETE",
        body: JSON.stringify({}),
      },
      token,
    );
  },
  createAchievement(token: string, input: { title: string; description?: string }) {
    return request<{
      achievement: ApiUser["achievements"][number];
    }>(
      "/profile/me/achievements",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token,
    );
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
  deletePost(token: string, id: string) {
    return request<void>(
      `/posts/${id}`,
      {
        method: "DELETE",
      },
      token,
    );
  },
  likePost(token: string, id: string) {
    return request<{ post: ApiPost }>(
      `/posts/${id}/like`,
      {
        method: "POST",
      },
      token,
    );
  },
  unlikePost(token: string, id: string) {
    return request<{ post: ApiPost }>(
      `/posts/${id}/like`,
      {
        method: "DELETE",
      },
      token,
    );
  },
  getComments(token: string, postId: string) {
    return request<{ comments: ApiComment[] }>(
      `/posts/${postId}/comments`,
      {},
      token,
    );
  },
  createComment(token: string, postId: string, input: { text: string }) {
    return request<{ comment: ApiComment }>(
      `/posts/${postId}/comments`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token,
    );
  },
  deleteComment(token: string, postId: string, commentId: string) {
    return request<void>(
      `/posts/${postId}/comments/${commentId}`,
      {
        method: "DELETE",
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
