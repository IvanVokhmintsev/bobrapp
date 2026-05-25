export type AppTab = "feed" | "booking" | "events" | "profile";

type AppTabBarProps = {
  active: AppTab;
  onSelect?: (tab: AppTab) => void;
};

export function AppTabBar(props: AppTabBarProps) {
  return (
    <nav className="app-tabbar" aria-label="Основная навигация">
      <button
        type="button"
        className={props.active === "feed" ? "is-active" : ""}
        onClick={() => props.onSelect?.("feed")}
      >
        <TabHomeIcon />
        <span>Лента</span>
      </button>
      <button
        type="button"
        className={props.active === "booking" ? "is-active" : ""}
        onClick={() => props.onSelect?.("booking")}
      >
        <TabMusicIcon />
        <span>Букинг</span>
      </button>
      <button
        type="button"
        className={props.active === "events" ? "is-active" : ""}
        onClick={() => props.onSelect?.("events")}
      >
        <TabEventsIcon />
        <span>События</span>
      </button>
      <button
        type="button"
        className={props.active === "profile" ? "is-active" : ""}
        onClick={() => props.onSelect?.("profile")}
      >
        <TabProfileIcon />
        <span>Профиль</span>
      </button>
    </nav>
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
