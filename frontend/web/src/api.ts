export type UserRole = "musician" | "label";
export type MusicianLevel = "nothing" | "beginner" | "advanced" | "professional";
export type PostType = "professional" | "roadmap";
export type ProfileType = "solo" | "band";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  musicianProfile: null | {
    id: string;
    profileType: ProfileType;
    level: MusicianLevel | null;
    bio: string | null;
    avatarUrl: string | null;
    location: string | null;
    genres: string[];
    instruments: string[];
    daw: string[];
    memberNames: string[];
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
  favoritedByMe?: boolean;
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
  favoritedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    role: UserRole;
    avatarUrl: string | null;
    profileType: ProfileType;
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

export type ApiProfileAlbum = {
  id: string;
  title: string;
  releaseDate: string | null;
  coverUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiProfileConcert = {
  id: string;
  venue: string;
  eventDate: string;
  coverUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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
  checklistChecked: number[];
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
  onboardMusician(input: {
    level: MusicianLevel;
    profileType?: ProfileType;
    memberNames?: string[];
  }) {
    return request<{ user: ApiUser }>(
      "/onboarding/musician",
      {
        method: "POST",
        body: JSON.stringify(input),
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
      profileType?: ProfileType;
      genres?: string[];
      instruments?: string[];
      daw?: string[];
      memberNames?: string[];
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
  getPosts(input?: { cursor?: string; limit?: number; type?: PostType }) {
    const params = new URLSearchParams();
    if (input?.cursor) {
      params.set("cursor", input.cursor);
    }
    if (input?.limit) {
      params.set("limit", String(input.limit));
    }
    if (input?.type) {
      params.set("type", input.type);
    }
    const query = params.toString();
    return request<{ posts: ApiPost[]; pageInfo: PageInfo }>(
      `/posts${query ? `?${query}` : ""}`,
    );
  },
  getProfiles(input: { q?: string; type?: ProfileType; cursor?: string } = {}) {
    const params = new URLSearchParams();
    if (input.q) {
      params.set("q", input.q);
    }
    if (input.type) {
      params.set("type", input.type);
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
  getProfileAlbums(userId: string) {
    return request<{ albums: ApiProfileAlbum[] }>(`/profiles/${userId}/albums`);
  },
  getProfileConcerts(userId: string) {
    return request<{ concerts: ApiProfileConcert[] }>(
      `/profiles/${userId}/concerts`,
    );
  },
  createProfileAlbum(input: {
    title: string;
    releaseDate?: string | null;
    coverUrl?: string | null;
  }) {
    return request<{ album: ApiProfileAlbum }>("/profile/me/albums", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateProfileAlbum(
    albumId: string,
    input: {
      title?: string;
      releaseDate?: string | null;
      coverUrl?: string | null;
    },
  ) {
    return request<{ album: ApiProfileAlbum }>(
      `/profile/me/albums/${albumId}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
    );
  },
  deleteProfileAlbum(albumId: string) {
    return request<void>(`/profile/me/albums/${albumId}`, {
      method: "DELETE",
    });
  },
  uploadProfileAlbumCover(albumId: string, file: File) {
    const formData = new FormData();
    formData.append("cover", file);

    return request<{ album: ApiProfileAlbum }>(
      `/profile/me/albums/${albumId}/cover`,
      {
        method: "POST",
        body: formData,
      },
    );
  },
  deleteProfileAlbumCover(albumId: string) {
    return request<{ album: ApiProfileAlbum }>(
      `/profile/me/albums/${albumId}/cover`,
      {
        method: "DELETE",
      },
    );
  },
  createProfileConcert(input: {
    venue: string;
    eventDate: string;
    coverUrl?: string | null;
  }) {
    return request<{ concert: ApiProfileConcert }>("/profile/me/concerts", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateProfileConcert(
    concertId: string,
    input: {
      venue?: string;
      eventDate?: string;
      coverUrl?: string | null;
    },
  ) {
    return request<{ concert: ApiProfileConcert }>(
      `/profile/me/concerts/${concertId}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
    );
  },
  deleteProfileConcert(concertId: string) {
    return request<void>(`/profile/me/concerts/${concertId}`, {
      method: "DELETE",
    });
  },
  uploadProfileConcertCover(concertId: string, file: File) {
    const formData = new FormData();
    formData.append("cover", file);

    return request<{ concert: ApiProfileConcert }>(
      `/profile/me/concerts/${concertId}/cover`,
      {
        method: "POST",
        body: formData,
      },
    );
  },
  deleteProfileConcertCover(concertId: string) {
    return request<{ concert: ApiProfileConcert }>(
      `/profile/me/concerts/${concertId}/cover`,
      {
        method: "DELETE",
      },
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
  favoriteArtist(userId: string) {
    return request<{ favorited: boolean }>(`/profiles/${userId}/favorite`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  unfavoriteArtist(userId: string) {
    return request<{ favorited: boolean }>(`/profiles/${userId}/favorite`, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
  favoritePost(postId: string) {
    return request<{ post: ApiPost; favorited: boolean }>(
      `/posts/${postId}/favorite`,
      {
        method: "POST",
      },
    );
  },
  unfavoritePost(postId: string) {
    return request<{ post: ApiPost; favorited: boolean }>(
      `/posts/${postId}/favorite`,
      {
        method: "DELETE",
      },
    );
  },
  getFavoriteArtists(params?: { cursor?: string; limit?: number }) {
    const search = new URLSearchParams();
    if (params?.cursor) {
      search.set("cursor", params.cursor);
    }
    if (params?.limit) {
      search.set("limit", String(params.limit));
    }
    const query = search.toString();

    return request<{ users: ApiUser[]; pageInfo: PageInfo }>(
      `/profile/me/favorites/artists${query ? `?${query}` : ""}`,
    );
  },
  getFavoritePosts(params?: { cursor?: string; limit?: number }) {
    const search = new URLSearchParams();
    if (params?.cursor) {
      search.set("cursor", params.cursor);
    }
    if (params?.limit) {
      search.set("limit", String(params.limit));
    }
    const query = search.toString();

    return request<{ posts: ApiPost[]; pageInfo: PageInfo }>(
      `/profile/me/favorites/posts${query ? `?${query}` : ""}`,
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
  updateChecklist(stepId: string, checkedIndices: number[]) {
    return request<{ step: RoadmapLesson }>(`/roadmap/${stepId}/checklist`, {
      method: "PATCH",
      body: JSON.stringify({ checkedIndices }),
    });
  },
};
