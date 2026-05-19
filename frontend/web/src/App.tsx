import { useEffect, useMemo, useState } from "react";

import {
  api,
  type ApiPost,
  type ApiUser,
  type MusicianLevel,
  type PostType,
  type RoadmapLesson,
  type RoadmapStep,
  type UserRole,
} from "./api";

type View = "auth" | "onboarding" | "feed" | "roadmap" | "profile";

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

  async function loadPosts() {
    const result = await api.getPosts(props.token);
    setPosts(result.posts);
  }

  useEffect(() => {
    void loadPosts();
  }, []);

  async function createPost() {
    await api.createPost(props.token, { text, type });
    setText("");
    await loadPosts();
  }

  async function likePost(id: string) {
    await api.likePost(props.token, id);
    await loadPosts();
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
      {posts.map((post) => (
        <article className="panel" key={post.id}>
          <strong>{post.author.name}</strong> <span>{post.type}</span>
          <p>{post.text}</p>
          <button onClick={() => likePost(post.id)}>Like {post.likesCount}</button>
        </article>
      ))}
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

  const achievements = useMemo(() => props.user.achievements ?? [], [props.user]);

  async function save() {
    const result = await api.updateProfile(props.token, {
      name,
      bio,
      avatarUrl,
    });
    props.onUserChange(result.user);
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
      <button onClick={save}>Save</button>
      <p>Points: {props.user.musicianProfile?.points ?? 0}</p>
      <p>Roadmap progress: {props.user.musicianProfile?.roadmapProgress ?? 0}%</p>
      <h3>Achievements</h3>
      <ul>
        {achievements.map((achievement) => (
          <li key={achievement.id}>{achievement.title}</li>
        ))}
      </ul>
    </main>
  );
}
