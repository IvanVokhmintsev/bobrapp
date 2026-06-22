import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, type ApiUser, type UserRole } from "../../api";
import registrationBg from "../../assets/auth/registration-bg.png";
import { AuthRolePicker } from "../../components/AuthRolePicker";
import { useAuth } from "../../context/AuthContext";

export function AuthScreen() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("musician");
  const [error, setError] = useState("");

  function redirectAfterAuth(nextUser: ApiUser) {
    const target =
      (nextUser.role === "musician" && !nextUser.musicianProfile?.level) ||
      (nextUser.role === "label" && !nextUser.labelProfile?.onboardedAt)
        ? "/onboarding"
        : "/feed";
    navigate(target, { replace: true });
  }

  async function submit() {
    try {
      setError("");
      const displayName = `${firstName} ${lastName}`.trim();
      const result =
        mode === "login"
          ? await api.login({ email, password })
          : await api.register({
              name: displayName || email,
              email,
              password,
              role,
            });
      setUser(result.user);
      redirectAfterAuth(result.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Auth failed");
    }
  }

  return (
    <main className="auth-screen">
      <img className="auth-screen__bg" src={registrationBg} alt="" />
      <section className="auth-card" aria-label={mode === "login" ? "Вход" : "Регистрация"}>
        <div className="auth-card__brand">
          <span className="auth-card__mark">A</span>
          <span className="auth-card__brand-name">MTC Artist</span>
        </div>

        <h1 className="auth-card__title">
          {mode === "login" ? "Вход" : "Регистрация"}
        </h1>

        <div className="auth-card__form">
          {mode === "register" ? (
            <>
              <label className="auth-field">
                <span>Имя</span>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Например, Иван"
                  autoComplete="given-name"
                />
              </label>
              <label className="auth-field">
                <span>Фамилия</span>
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Например, Иванов"
                  autoComplete="family-name"
                />
              </label>
              <label className="auth-field">
                <span>Номер телефона</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+7-800-555-35-35"
                  autoComplete="tel"
                />
              </label>
            </>
          ) : null}

          {mode === "register" ? <AuthRolePicker value={role} onChange={setRole} /> : null}

          <label className="auth-field">
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={mode === "login" ? "ivanov@bobr.ru" : "iivanov@bobr.ru"}
              autoComplete="email"
            />
          </label>

          <label className="auth-field">
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Минимум 6 символов"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
        </div>

        {error ? <p className="auth-card__error">{error}</p> : null}

        <button className="auth-card__submit" onClick={() => void submit()}>
          {mode === "login" ? "Войти" : "Далее"}
          <span aria-hidden="true">›</span>
        </button>

        <button
          className="auth-card__mode"
          onClick={() => {
            setError("");
            setMode(mode === "login" ? "register" : "login");
          }}
        >
          {mode === "login" ? "Создать аккаунт" : "Уже есть аккаунт"}
        </button>
      </section>
    </main>
  );
}
