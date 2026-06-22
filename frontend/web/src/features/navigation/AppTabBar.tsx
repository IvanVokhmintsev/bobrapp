import { Link, useLocation } from "react-router-dom";

import type { ApiUser } from "../../api";

type AppTabBarProps = {
  user: ApiUser;
};

export function AppTabBar(props: AppTabBarProps) {
  const location = useLocation();
  const navItems = buildTabItems(props.user.role);

  return (
    <nav className="app-tabbar" aria-label="Основная навигация">
      {navItems.map((item) => {
        const isActive =
          location.pathname === item.to ||
          (item.to === "/roadmap/map" && location.pathname.startsWith("/roadmap")) ||
          (item.to === "/proposals" && location.pathname.startsWith("/proposals"));

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

function buildTabItems(role: ApiUser["role"]) {
  if (role === "label") {
    return [
      { to: "/feed", label: "Лента" },
      { to: "/people", label: "Музыканты" },
      { to: "/proposals", label: "Предложения" },
      { to: "/profile", label: "Профиль" },
    ] as const;
  }

  const items = [
    { to: "/feed", label: "Лента" },
    { to: "/people", label: "Музыканты" },
    { to: "/booking", label: "Букинг" },
    { to: "/events", label: "События" },
    { to: "/profile", label: "Профиль" },
  ] as const;

  if (role !== "musician") {
    return items;
  }

  return [
    items[0],
    items[1],
    { to: "/roadmap/map", label: "Roadmap" },
    items[2],
    items[4],
  ];
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
    case "Музыканты":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="15" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path
            d="M3 18c0-2.8 2.2-5 5-5h0c2.1 0 3.9 1.3 4.6 3.2M13 18c0-1.8 1.5-3.2 3.2-3.2H17c1.5 0 2.8 1 3.2 2.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case "Избранное":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <path
            d="M6 4.5h10v13l-5-3.5L6 17.5V4.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      );
    case "Предложения":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <path
            d="M3 6h16v10H3V6Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M3 7l8 5 8-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case "Roadmap":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
          <path
            d="M4 4h14v14H4V4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M7 8h8M7 11h8M7 14h5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
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
