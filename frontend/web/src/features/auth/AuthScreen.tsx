import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { api, type ApiUser, type UserRole } from "../../api";
import registrationBg from "../../assets/auth/registration-bg.png";
import { AuthPasswordField } from "../../components/AuthPasswordField";
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
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [role, setRole] = useState<UserRole>("musician");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetRegisterFields() {
    setPasswordConfirm("");
    setPasswordVisible(false);
    setError("");
  }

  function switchMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setPasswordVisible(false);
    resetRegisterFields();
  }

  function redirectAfterAuth(nextUser: ApiUser) {
    const target =
      (nextUser.role === "musician" && !nextUser.musicianProfile?.level) ||
      (nextUser.role === "label" && !nextUser.labelProfile?.onboardedAt)
        ? "/onboarding"
        : "/feed";
    navigate(target, { replace: true });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (mode === "register") {
      const displayName = `${firstName} ${lastName}`.trim();

      if (!displayName) {
        setError("Укажите имя и фамилию");
        return;
      }

      if (password.length < 6) {
        setError("Пароль должен быть не короче 6 символов");
        return;
      }

      if (password !== passwordConfirm) {
        setError("Пароли не совпадают");
        return;
      }
    }

    try {
      setIsSubmitting(true);
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
      setError(caught instanceof Error ? caught.message : "Не удалось выполнить вход");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <img className="auth-screen__bg" src={registrationBg} alt="" />
      <section
        className={`auth-card ${mode === "register" ? "auth-card--register" : ""}`}
        aria-label={mode === "login" ? "Вход" : "Регистрация"}
      >
        <div className="auth-card__brand">
          <span className="auth-card__mark">A</span>
          <span className="auth-card__brand-name">MTC Artist</span>
        </div>

        <h1 className="auth-card__title">
          {mode === "login" ? "Вход" : "Регистрация"}
        </h1>

        <form className="auth-card__form" onSubmit={(event) => void submit(event)}>
          {mode === "register" ? <AuthRolePicker value={role} onChange={setRole} /> : null}

          {mode === "register" ? (
            <div className="auth-card__name-row">
              <label className="auth-field">
                <span>Имя</span>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Иван"
                  autoComplete="given-name"
                />
              </label>
              <label className="auth-field">
                <span>Фамилия</span>
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Иванов"
                  autoComplete="family-name"
                />
              </label>
            </div>
          ) : null}

          {mode === "register" ? (
            <label className="auth-field">
              <span>Номер телефона</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+7 900 000-00-00"
                autoComplete="tel"
              />
            </label>
          ) : null}

          <label className="auth-field">
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={mode === "login" ? "ivanov@bobr.ru" : "ivanov@bobr.ru"}
              autoComplete="email"
              type="email"
              required
            />
          </label>

          <AuthPasswordField
            label="Пароль"
            value={password}
            onChange={setPassword}
            placeholder="Минимум 6 символов"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 6 : undefined}
            visible={passwordVisible}
            onVisibleChange={setPasswordVisible}
          />

          {mode === "register" ? (
            <AuthPasswordField
              label="Подтверждение пароля"
              value={passwordConfirm}
              onChange={setPasswordConfirm}
              placeholder="Повторите пароль"
              autoComplete="new-password"
              required
              minLength={6}
              visible={passwordVisible}
              onVisibleChange={setPasswordVisible}
            />
          ) : null}

          {error ? <p className="auth-card__error">{error}</p> : null}

          <button className="auth-card__submit" type="submit" disabled={isSubmitting}>
            {mode === "login" ? "Войти" : "Создать аккаунт"}
            <span aria-hidden="true">›</span>
          </button>
        </form>

        <button
          type="button"
          className="auth-card__mode"
          onClick={() => switchMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Создать аккаунт" : "Уже есть аккаунт"}
        </button>
      </section>
    </main>
  );
}
