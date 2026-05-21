import { useEffect, useMemo, useState } from "react";

import {
  api,
  type ApiPost,
  type ApiUser,
  type MusicianLevel,
  type RoadmapLesson,
  type RoadmapStep,
  type UserRole,
} from "./api";
import { FeedScreen } from "./features/feed/FeedScreen";

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
      {view === "feed" ? null : (
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
      )}

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
      {view === "feed" ? (
        <FeedScreen
          token={token}
          user={user}
          onSelectTab={(tab) => {
            if (tab === "profile") {
              setView("profile");
            } else if (tab === "booking" || tab === "events") {
              setView("discover");
            } else {
              setView("feed");
            }
          }}
        />
      ) : null}
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
