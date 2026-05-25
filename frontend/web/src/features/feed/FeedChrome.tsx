import type { PostType } from "../../api";

export function FeedTopBar() {
  return (
    <header className="feed-topbar">
      <div className="feed-topbar__title-wrap">
        <p className="feed-topbar__kicker">Bobrapp</p>
        <h1 className="feed-topbar__title">Лента</h1>
      </div>
      <div className="feed-topbar__tools" aria-label="Действия ленты">
        <button type="button" className="feed-topbar__tool" aria-label="Поиск">
          <SearchIcon />
        </button>
        <button type="button" className="feed-topbar__tool" aria-label="Фильтры">
          <FilterIcon />
        </button>
      </div>
    </header>
  );
}

export function FeedComposer(props: {
  text: string;
  type: PostType;
  onTextChange: (value: string) => void;
  onTypeChange: (value: PostType) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="feed-composer" aria-label="Новый пост">
      <textarea
        value={props.text}
        onChange={(event) => props.onTextChange(event.target.value)}
        placeholder="Что нового у вас в музыке?"
        rows={3}
      />
      <div className="feed-composer__actions">
        <select
          value={props.type}
          onChange={(event) => props.onTypeChange(event.target.value as PostType)}
          aria-label="Тип поста"
        >
          <option value="professional">Проф. пост</option>
          <option value="roadmap">Роудмап</option>
        </select>
        <button type="button" onClick={props.onSubmit}>
          Опубликовать
        </button>
      </div>
    </section>
  );
}

export function FeedProBanner() {
  return (
    <section className="feed-pro" aria-label="Подписка Pro">
      <button type="button" className="feed-pro__close" aria-label="Закрыть">
        ×
      </button>
      <p>
        Оформите подписку Pro, чтобы повысить видимость ваших постов и
        разблокировать дополнительный функционал
      </p>
      <strong>попробовать от 199₽/мес ›</strong>
    </section>
  );
}

export function FeedTabBar(props: {
  onSelect?: (tab: "feed" | "booking" | "events" | "profile") => void;
}) {
  return (
    <nav className="feed-tabbar" aria-label="Основная навигация">
      <button type="button" className="is-active" onClick={() => props.onSelect?.("feed")}>
        <TabHomeIcon />
        <span>Лента</span>
      </button>
      <button type="button" onClick={() => props.onSelect?.("booking")}>
        <TabMusicIcon />
        <span>Букинг</span>
      </button>
      <button type="button" onClick={() => props.onSelect?.("events")}>
        <TabEventsIcon />
        <span>События</span>
      </button>
      <button type="button" onClick={() => props.onSelect?.("profile")}>
        <TabProfileIcon />
        <span>Профиль</span>
      </button>
    </nav>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M11.5 11.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M2 4h14M5 9h8M7 14h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TabHomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path
        d="M3 9.5 11 3l8 6.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function TabMusicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path
        d="M9 17V6l8-2v11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="7" cy="17" r="2" fill="currentColor" />
      <circle cx="15" cy="15" r="2" fill="currentColor" />
    </svg>
  );
}

function TabEventsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M11 7v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TabProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path
        d="M4 19c1.8-3.5 4.5-5 7-5s5.2 1.5 7 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
