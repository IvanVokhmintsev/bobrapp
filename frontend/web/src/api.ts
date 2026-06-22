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
  imageUrl: string | null;
  audioUrl: string | null;
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
): Promise<T> {
  const hasBody = options.body !== undefined;
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
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
    return request<{ user: ApiUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  login(input: { email: string; password: string }) {
    return request<{ user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  logout() {
    return request<void>("/auth/logout", {
      method: "POST",
    });
  },
  me() {
    return request<{ user: ApiUser }>("/auth/me");
  },
  onboardMusician(level: MusicianLevel) {
    return request<{ user: ApiUser }>(
      "/onboarding/musician",
      {
        method: "POST",
        body: JSON.stringify({ level }),
      },
    );
  },
  getProfile() {
    return request<{ user: ApiUser }>("/profile/me");
  },
  updateProfile(
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
    );
  },
  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);

    return request<{ user: ApiUser }>("/profile/me/avatar", {
      method: "POST",
      body: formData,
    });
  },
  deleteAvatar() {
    return request<{ user: ApiUser }>("/profile/me/avatar", {
      method: "DELETE",
    });
  },
  getPosts() {
    return request<{ posts: ApiPost[]; pageInfo: PageInfo }>("/posts");
  },
  getProfiles(input: { q?: string; cursor?: string } = {}) {
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
    );
  },
  getPublicProfile(userId: string) {
    return request<{ user: ApiUser }>(`/profiles/${userId}`);
  },
  getProfilePosts(userId: string) {
    return request<{ posts: ApiPost[]; pageInfo: PageInfo }>(
      `/profiles/${userId}/posts`,
    );
  },
  followProfile(userId: string) {
    return request<{ following: boolean }>(
      `/profiles/${userId}/follow`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );
  },
  unfollowProfile(userId: string) {
    return request<{ following: boolean }>(
      `/profiles/${userId}/follow`,
      {
        method: "DELETE",
        body: JSON.stringify({}),
      },
    );
  },
  createAchievement(input: { title: string; description?: string }) {
    return request<{
      achievement: ApiUser["achievements"][number];
    }>(
      "/profile/me/achievements",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },
  createPost(input: {
    text: string;
    type: PostType;
    image?: File | null;
    audio?: File | null;
  }) {
    const formData = new FormData();
    formData.append("type", input.type);
    formData.append("text", input.text);
    if (input.image) {
      formData.append("image", input.image);
    }
    if (input.audio) {
      formData.append("audio", input.audio);
    }

    return request<{ post: ApiPost }>("/posts", {
      method: "POST",
      body: formData,
    });
  },
  deletePost(id: string) {
    return request<void>(
      `/posts/${id}`,
      {
        method: "DELETE",
      },
    );
  },
  likePost(id: string) {
    return request<{ post: ApiPost }>(
      `/posts/${id}/like`,
      {
        method: "POST",
      },
    );
  },
  unlikePost(id: string) {
    return request<{ post: ApiPost }>(
      `/posts/${id}/like`,
      {
        method: "DELETE",
      },
    );
  },
  getComments(postId: string) {
    return request<{ comments: ApiComment[] }>(
      `/posts/${postId}/comments`,
    );
  },
  createComment(postId: string, input: { text: string }) {
    return request<{ comment: ApiComment }>(
      `/posts/${postId}/comments`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },
  deleteComment(postId: string, commentId: string) {
    return request<void>(
      `/posts/${postId}/comments/${commentId}`,
      {
        method: "DELETE",
      },
    );
  },
  getRoadmap() {
    return request<{ steps: RoadmapStep[] }>("/roadmap");
  },
  getLesson(stepId: string) {
    return request<{ step: RoadmapLesson }>(
      `/roadmap/${stepId}/lesson`,
    );
  },
  submitQuiz(
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
    );
  },
};
