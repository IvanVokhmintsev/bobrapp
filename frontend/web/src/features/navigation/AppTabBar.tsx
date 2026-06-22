import { Link, useLocation } from "react-router-dom";

const navItems = [
  { to: "/feed", label: "Лента" },
  { to: "/discover?section=booking", label: "Букинг", matchSearch: "?section=booking" },
  { to: "/discover?section=events", label: "События", matchSearch: "?section=events" },
  { to: "/profile", label: "Профиль" },
] as const;

export function AppTabBar() {
  const location = useLocation();

  return (
    <nav className="app-tabbar" aria-label="Основная навигация">
      {navItems.map((item) => {
        const isActive = "matchSearch" in item
          ? location.pathname === "/discover" && location.search === item.matchSearch
          : location.pathname === item.to;

        return (
          <Link key={item.label} to={item.to} className={isActive ? "is-active" : undefined}>
            <TabIcon label={item.label} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function TabIcon(props: { label: string }) {
  switch (props.label) {
    case "Лента":
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
    case "Букинг":
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
    case "События":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M11 7v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
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
}
