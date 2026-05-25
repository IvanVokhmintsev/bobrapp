import { useEffect, useState } from "react";

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
import { ProfileScreen } from "./features/profile/ProfileScreen";

type View = "auth" | "onboarding" | "feed" | "discover" | "roadmap" | "profile";

const levels: Array<{ value: MusicianLevel; label: string }> = [
  { value: "nothing", label: "Почти ничего не знаю" },
  { value: "beginner", label: "Новичок" },
  { value: "advanced", label: "Уверенно занимаюсь музыкой" },
  { value: "professional", label: "Профессионально занимаюсь музыкой" },
];

export function App() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [view, setView] = useState<View>("auth");
  const [message, setMessage] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  async function loadMe() {
    const result = await api.me();
    setUser(result.user);
    setView(
      result.user.role === "musician" && !result.user.musicianProfile?.level
        ? "onboarding"
        : "feed",
    );
  }

  useEffect(() => {
    void loadMe()
      .catch(() => {
        setUser(null);
        setView("auth");
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, []);

  function handleAuth(nextUser: ApiUser) {
    setUser(nextUser);
    setView(
      nextUser.role === "musician" && !nextUser.musicianProfile?.level
        ? "onboarding"
        : "feed",
    );
  }

  async function logout() {
    await api.logout().catch(() => {
      /* clear local state even if the session is already gone */
    });
    setUser(null);
    setView("auth");
  }

  if (isBootstrapping) {
    return <main className="panel">Loading...</main>;
  }

  if (!user) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return (
    <div
      className={
        view === "feed" || view === "profile"
          ? "app-shell app-shell--feed"
          : "app-shell"
      }
    >
      {view === "feed" || view === "profile" ? null : (
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
            <button onClick={() => void logout()}>Logout</button>
          </nav>
        </header>
      )}

      {message ? <p className="message">{message}</p> : null}

      {view === "onboarding" ? (
        <OnboardingScreen
          onDone={(nextUser) => {
            setUser(nextUser);
            setView("feed");
          }}
          onError={setMessage}
        />
      ) : null}
      {view === "feed" ? (
        <FeedScreen
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
      {view === "discover" ? <DiscoverScreen user={user} /> : null}
      {view === "roadmap" ? <RoadmapScreen /> : null}
      {view === "profile" ? (
        <ProfileScreen
          user={user}
          onUserChange={setUser}
          onSelectTab={(tab) => {
            if (tab === "feed") {
              setView("feed");
            } else if (tab === "booking" || tab === "events") {
              setView("discover");
            } else {
              setView("profile");
            }
          }}
          onOpenRoadmap={() => setView("roadmap")}
        />
      ) : null}
    </div>
  );
}

function AuthScreen(props: {
  onAuth: (user: ApiUser) => void;
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
      props.onAuth(result.user);
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
  onDone: (user: ApiUser) => void;
  onError: (message: string) => void;
}) {
  async function choose(level: MusicianLevel) {
    try {
      const result = await api.onboardMusician(level);
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

function DiscoverScreen(props: { user: ApiUser }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [error, setError] = useState("");

  async function loadProfiles(nextQuery = query) {
    try {
      setError("");
      const result = await api.getProfiles({ q: nextQuery });
      setUsers(result.users);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load profiles");
    }
  }

  async function openProfile(userId: string) {
    try {
      setError("");
      const [profileResult, postsResult] = await Promise.all([
        api.getPublicProfile(userId),
        api.getProfilePosts(userId),
      ]);
      setSelectedUser(profileResult.user);
      setPosts(postsResult.posts);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to open profile");
    }
  }

  async function toggleFollow(user: ApiUser) {
    if (user.followingByMe) {
      await api.unfollowProfile(user.id);
    } else {
      await api.followProfile(user.id);
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

function RoadmapScreen() {
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
