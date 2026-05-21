import { useEffect, useMemo, useState } from "react";

import {
  api,
  type ApiComment,
  type ApiPost,
  type ApiUser,
  type MusicianLevel,
  type PostType,
  type RoadmapLesson,
  type RoadmapStep,
  type UserRole,
} from "./api";

type View = "auth" | "onboarding" | "feed" | "discover" | "roadmap" | "profile";

const levels: Array<{ value: MusicianLevel; label: string }> = [
  { value: "nothing", label: "Почти ничего не знаю" },
  { value: "beginner", label: "Новичок" },
  { value: "advanced", label: "Уверенно занимаюсь музыкой" },
  { value: "professional", label: "Профессионально занимаюсь музыкой" },
];

function getInitialToken() {
  return localStorage.getItem("bobrapp_token");
}

export function App() {
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [view, setView] = useState<View>("auth");
  const [message, setMessage] = useState("");

  async function loadMe(currentToken = token) {
    if (!currentToken) {
      return;
    }

    const result = await api.me(currentToken);
    setUser(result.user);
    setView(
      result.user.role === "musician" && !result.user.musicianProfile?.level
        ? "onboarding"
        : "feed",
    );
  }

  useEffect(() => {
    if (token) {
      void loadMe(token).catch(() => {
        localStorage.removeItem("bobrapp_token");
        setToken(null);
        setView("auth");
      });
    }
  }, []);

  function handleAuth(nextToken: string, nextUser: ApiUser) {
    localStorage.setItem("bobrapp_token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setView(
      nextUser.role === "musician" && !nextUser.musicianProfile?.level
        ? "onboarding"
        : "feed",
    );
  }

  function logout() {
    localStorage.removeItem("bobrapp_token");
    setToken(null);
    setUser(null);
    setView("auth");
  }

  if (!token || !user) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return (
    <div className="app-shell">
      <header>
        <div>
          <strong>Bobrapp</strong>
          <span> {user.name}</span>
        </div>
        <nav>
          <button onClick={() => setView("feed")}>Feed</button>
          <button onClick={() => setView("discover")}>Discover</button>
          <button onClick={() => setView("roadmap")}>Roadmap</button>
          <button onClick={() => setView("profile")}>Profile</button>
          <button onClick={logout}>Logout</button>
        </nav>
      </header>

      {message ? <p className="message">{message}</p> : null}

      {view === "onboarding" ? (
        <OnboardingScreen
          token={token}
          onDone={(nextUser) => {
            setUser(nextUser);
            setView("feed");
          }}
          onError={setMessage}
        />
      ) : null}
      {view === "feed" ? <FeedScreen token={token} user={user} /> : null}
      {view === "discover" ? <DiscoverScreen token={token} user={user} /> : null}
      {view === "roadmap" ? <RoadmapScreen token={token} /> : null}
      {view === "profile" ? (
        <ProfileScreen token={token} user={user} onUserChange={setUser} />
      ) : null}
    </div>
  );
}

function AuthScreen(props: {
  onAuth: (token: string, user: ApiUser) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("Test Musician");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState<UserRole>("musician");
  const [error, setError] = useState("");

  async function submit() {
    try {
      setError("");
      const result =
        mode === "login"
          ? await api.login({ email, password })
          : await api.register({ name, email, password, role });
      props.onAuth(result.token, result.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Auth failed");
    }
  }

  return (
    <main className="panel">
      <h1>{mode === "login" ? "Sign in" : "Sign up"}</h1>
      {mode === "register" ? (
        <>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Role
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <option value="musician">musician</option>
              <option value="label">label</option>
            </select>
          </label>
        </>
      ) : null}
      <label>
        Email
        <input value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button onClick={submit}>{mode === "login" ? "Login" : "Register"}</button>
      <button onClick={() => setMode(mode === "login" ? "register" : "login")}>
        Switch to {mode === "login" ? "register" : "login"}
      </button>
    </main>
  );
}

function OnboardingScreen(props: {
  token: string;
  onDone: (user: ApiUser) => void;
  onError: (message: string) => void;
}) {
  async function choose(level: MusicianLevel) {
    try {
      const result = await api.onboardMusician(props.token, level);
      props.onDone(result.user);
    } catch (caught) {
      props.onError(caught instanceof Error ? caught.message : "Onboarding failed");
    }
  }

  return (
    <main className="panel">
      <h2>Выбери уровень</h2>
      {levels.map((level) => (
        <button key={level.value} onClick={() => choose(level.value)}>
          {level.label}
        </button>
      ))}
    </main>
  );
}

function FeedScreen(props: { token: string; user: ApiUser }) {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [text, setText] = useState("");
  const [type, setType] = useState<PostType>("professional");
  const [error, setError] = useState("");
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, ApiComment[]>
  >({});
  const [commentTextByPost, setCommentTextByPost] = useState<
    Record<string, string>
  >({});

  async function loadPosts() {
    const result = await api.getPosts(props.token);
    setPosts(result.posts);
  }

  useEffect(() => {
    void loadPosts();
  }, []);

  async function createPost() {
    try {
      setError("");
      await api.createPost(props.token, { text, type });
      setText("");
      await loadPosts();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create post");
    }
  }

  async function likePost(id: string) {
    const target = posts.find((post) => post.id === id);
    if (!target) {
      return;
    }
    try {
      setError("");
      const result = target.likedByMe
        ? await api.unlikePost(props.token, id)
        : await api.likePost(props.token, id);
      setPosts((currentPosts) =>
        currentPosts.map((post) => (post.id === id ? result.post : post)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update like");
    }
  }

  async function deletePost(id: string) {
    try {
      setError("");
      await api.deletePost(props.token, id);
      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== id));
      setCommentsByPost((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to delete post");
    }
  }

  async function toggleComments(postId: string) {
    if (commentsByPost[postId]) {
      setCommentsByPost((current) => {
        const next = { ...current };
        delete next[postId];
        return next;
      });
      return;
    }

    try {
      setError("");
      const result = await api.getComments(props.token, postId);
      setCommentsByPost((current) => ({
        ...current,
        [postId]: result.comments,
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load comments");
    }
  }

  async function createComment(postId: string) {
    const text = commentTextByPost[postId]?.trim();
    if (!text) {
      return;
    }

    try {
      setError("");
      const result = await api.createComment(props.token, postId, { text });
      setCommentsByPost((current) => ({
        ...current,
        [postId]: [...(current[postId] ?? []), result.comment],
      }));
      setCommentTextByPost((current) => ({
        ...current,
        [postId]: "",
      }));
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? { ...post, commentsCount: post.commentsCount + 1 }
            : post,
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to add comment");
    }
  }

  async function deleteComment(post: ApiPost, commentId: string) {
    try {
      setError("");
      await api.deleteComment(props.token, post.id, commentId);
      setCommentsByPost((current) => ({
        ...current,
        [post.id]: (current[post.id] ?? []).filter(
          (comment) => comment.id !== commentId,
        ),
      }));
      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === post.id
            ? {
                ...currentPost,
                commentsCount: Math.max(0, currentPost.commentsCount - 1),
              }
            : currentPost,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to delete comment",
      );
    }
  }

  return (
    <main>
      <h2>Feed</h2>
      {props.user.role === "musician" ? (
        <section className="panel">
          <textarea value={text} onChange={(event) => setText(event.target.value)} />
          <select value={type} onChange={(event) => setType(event.target.value as PostType)}>
            <option value="professional">professional</option>
            <option value="roadmap">roadmap</option>
          </select>
          <button onClick={createPost}>Create post</button>
        </section>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      {posts.map((post) => (
        <article className="panel" key={post.id}>
          <strong>{post.author.name}</strong> <span>{post.type}</span>
          <p>{post.text}</p>
          <button onClick={() => likePost(post.id)}>
            {post.likedByMe ? "Unlike" : "Like"} {post.likesCount}
          </button>
          <button onClick={() => toggleComments(post.id)}>
            Comments {post.commentsCount}
          </button>
          {post.author.id === props.user.id ? (
            <button onClick={() => deletePost(post.id)}>Delete post</button>
          ) : null}
          {commentsByPost[post.id] ? (
            <section className="comments">
              {commentsByPost[post.id].map((comment) => (
                <div className="comment" key={comment.id}>
                  <strong>{comment.author.name}</strong>
                  <p>{comment.text}</p>
                  {comment.author.id === props.user.id ||
                  post.author.id === props.user.id ? (
                    <button onClick={() => deleteComment(post, comment.id)}>
                      Delete comment
                    </button>
                  ) : null}
                </div>
              ))}
              <textarea
                value={commentTextByPost[post.id] ?? ""}
                onChange={(event) =>
                  setCommentTextByPost((current) => ({
                    ...current,
                    [post.id]: event.target.value,
                  }))
                }
              />
              <button onClick={() => createComment(post.id)}>Add comment</button>
            </section>
          ) : null}
        </article>
      ))}
    </main>
  );
}

function DiscoverScreen(props: { token: string; user: ApiUser }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [error, setError] = useState("");

  async function loadProfiles(nextQuery = query) {
    try {
      setError("");
      const result = await api.getProfiles(props.token, { q: nextQuery });
      setUsers(result.users);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load profiles");
    }
  }

  async function openProfile(userId: string) {
    try {
      setError("");
      const [profileResult, postsResult] = await Promise.all([
        api.getPublicProfile(props.token, userId),
        api.getProfilePosts(props.token, userId),
      ]);
      setSelectedUser(profileResult.user);
      setPosts(postsResult.posts);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to open profile");
    }
  }

  async function toggleFollow(user: ApiUser) {
    if (user.followingByMe) {
      await api.unfollowProfile(props.token, user.id);
    } else {
      await api.followProfile(props.token, user.id);
    }
    await loadProfiles();
    if (selectedUser?.id === user.id) {
      await openProfile(user.id);
    }
  }

  useEffect(() => {
    void loadProfiles("");
  }, []);

  return (
    <main>
      <h2>Discover musicians</h2>
      <section className="panel">
        <label>
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name"
          />
        </label>
        <button onClick={() => loadProfiles()}>Search</button>
      </section>
      {error ? <p className="error">{error}</p> : null}
      <div className="split">
        <section>
          {users.map((profile) => (
            <article className="panel" key={profile.id}>
              <strong>{profile.name}</strong>
              <p>{profile.musicianProfile?.bio ?? "No bio yet"}</p>
              <p>
                Followers: {profile.followersCount ?? 0} / Following:{" "}
                {profile.followingCount ?? 0}
              </p>
              <button onClick={() => openProfile(profile.id)}>Open</button>
              {profile.id !== props.user.id ? (
                <button onClick={() => toggleFollow(profile)}>
                  {profile.followingByMe ? "Unfollow" : "Follow"}
                </button>
              ) : null}
            </article>
          ))}
        </section>
        {selectedUser ? (
          <section className="panel">
            <h3>{selectedUser.name}</h3>
            <p>{selectedUser.musicianProfile?.bio ?? "No bio yet"}</p>
            <p>{selectedUser.musicianProfile?.location ?? ""}</p>
            <p>Genres: {selectedUser.musicianProfile?.genres.join(", ")}</p>
            <p>Instruments: {selectedUser.musicianProfile?.instruments.join(", ")}</p>
            <p>DAW: {selectedUser.musicianProfile?.daw.join(", ")}</p>
            {selectedUser.id !== props.user.id ? (
              <button onClick={() => toggleFollow(selectedUser)}>
                {selectedUser.followingByMe ? "Unfollow" : "Follow"}
              </button>
            ) : null}
            <h4>Achievements</h4>
            <ul>
              {selectedUser.achievements.map((achievement) => (
                <li key={achievement.id}>{achievement.title}</li>
              ))}
            </ul>
            <h4>Posts</h4>
            {posts.map((post) => (
              <article className="compact-panel" key={post.id}>
                <strong>{post.type}</strong>
                <p>{post.text}</p>
                <small>
                  Likes: {post.likesCount} / Comments: {post.commentsCount} /
                  Reposts: {post.repostsCount}
                </small>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function RoadmapScreen(props: { token: string }) {
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [lesson, setLesson] = useState<RoadmapLesson | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function loadRoadmap() {
    const result = await api.getRoadmap(props.token);
    setSteps(result.steps);
  }

  useEffect(() => {
    void loadRoadmap();
  }, []);

  async function openLesson(stepId: string) {
    setError("");
    const result = await api.getLesson(props.token, stepId);
    setLesson(result.step);
    setAnswers({});
  }

  async function submitQuiz() {
    if (!lesson) {
      return;
    }

    try {
      const result = await api.submitQuiz(
        props.token,
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
    <main>
      <h2>Roadmap</h2>
      {steps.map((step) => (
        <div className="panel" key={step.id}>
          <strong>
            {step.order}. {step.title}
          </strong>
          <p>{step.description}</p>
          <p>Status: {step.status}</p>
          <button disabled={step.status === "locked"} onClick={() => openLesson(step.id)}>
            Open lesson
          </button>
        </div>
      ))}
      {lesson ? (
        <section className="panel">
          <h3>{lesson.title}</h3>
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
          {error ? <p className="error">{error}</p> : null}
          <button onClick={submitQuiz}>Submit quiz</button>
        </section>
      ) : null}
    </main>
  );
}

function ProfileScreen(props: {
  token: string;
  user: ApiUser;
  onUserChange: (user: ApiUser) => void;
}) {
  const [name, setName] = useState(props.user.name);
  const [bio, setBio] = useState(props.user.musicianProfile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(
    props.user.musicianProfile?.avatarUrl ?? "",
  );
  const [location, setLocation] = useState(
    props.user.musicianProfile?.location ?? "",
  );
  const [genres, setGenres] = useState(
    props.user.musicianProfile?.genres.join(", ") ?? "",
  );
  const [instruments, setInstruments] = useState(
    props.user.musicianProfile?.instruments.join(", ") ?? "",
  );
  const [daw, setDaw] = useState(props.user.musicianProfile?.daw.join(", ") ?? "");
  const [socialLinks, setSocialLinks] = useState(
    Object.entries(props.user.musicianProfile?.socialLinks ?? {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n"),
  );
  const [achievementTitle, setAchievementTitle] = useState("");
  const [achievementDescription, setAchievementDescription] = useState("");

  const achievements = useMemo(() => props.user.achievements ?? [], [props.user]);

  async function save() {
    const result = await api.updateProfile(props.token, {
      name,
      bio,
      avatarUrl,
      location,
      genres: splitList(genres),
      instruments: splitList(instruments),
      daw: splitList(daw),
      socialLinks: parseSocialLinks(socialLinks),
    });
    props.onUserChange(result.user);
  }

  async function addAchievement() {
    if (!achievementTitle.trim()) {
      return;
    }

    await api.createAchievement(props.token, {
      title: achievementTitle,
      description: achievementDescription || undefined,
    });
    const result = await api.getProfile(props.token);
    props.onUserChange(result.user);
    setAchievementTitle("");
    setAchievementDescription("");
  }

  return (
    <main className="panel">
      <h2>Profile</h2>
      <label>
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        Bio
        <textarea value={bio} onChange={(event) => setBio(event.target.value)} />
      </label>
      <label>
        Avatar URL
        <input
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
        />
      </label>
      <label>
        Location
        <input value={location} onChange={(event) => setLocation(event.target.value)} />
      </label>
      <label>
        Genres
        <input value={genres} onChange={(event) => setGenres(event.target.value)} />
      </label>
      <label>
        Instruments
        <input
          value={instruments}
          onChange={(event) => setInstruments(event.target.value)}
        />
      </label>
      <label>
        DAW
        <input value={daw} onChange={(event) => setDaw(event.target.value)} />
      </label>
      <label>
        Social links
        <textarea
          value={socialLinks}
          onChange={(event) => setSocialLinks(event.target.value)}
        />
      </label>
      <button onClick={save}>Save</button>
      <p>Points: {props.user.musicianProfile?.points ?? 0}</p>
      <p>Roadmap progress: {props.user.musicianProfile?.roadmapProgress ?? 0}%</p>
      <h3>Achievements</h3>
      <label>
        Title
        <input
          value={achievementTitle}
          onChange={(event) => setAchievementTitle(event.target.value)}
        />
      </label>
      <label>
        Description
        <textarea
          value={achievementDescription}
          onChange={(event) => setAchievementDescription(event.target.value)}
        />
      </label>
      <button onClick={addAchievement}>Add achievement</button>
      <ul>
        {achievements.map((achievement) => (
          <li key={achievement.id}>{achievement.title}</li>
        ))}
      </ul>
    </main>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSocialLinks(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((links, item) => {
      const [key, ...rest] = item.split(":");
      const link = rest.join(":").trim();
      if (key && link) {
        links[key.trim()] = link;
      }
      return links;
    }, {});
}
