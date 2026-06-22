import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { api, type ApiUser } from "../../api";
import defaultAvatar from "../../assets/feed/card-cover.png";
import levelFlagIcon from "../../assets/profile/level-flag.svg";
import { BookmarkIcon } from "../../components/BookmarkIcon";
import navBookingIcon from "../../assets/profile/nav-booking.svg";
import navEventsIcon from "../../assets/profile/nav-events.svg";
import navFeedIcon from "../../assets/profile/nav-feed.svg";
import navMusiciansIcon from "../../assets/profile/nav-musicians.svg";
import navProfileIcon from "../../assets/profile/nav-profile.svg";
import { useAuth } from "../../context/AuthContext";
import { getMusicianLevelFromUser } from "../../lib/musicianLevel";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import { ProPanel } from "./ProPanel";
import "../proposals/proposals.css";

type AppSidebarProps = {
  user: ApiUser;
};

const baseNavItems = [
  { to: "/feed", label: "Лента", icon: navFeedIcon },
  { to: "/people", label: "Музыканты", icon: navMusiciansIcon },
  { to: "/favorites", label: "Избранное", icon: "bookmark" as const },
  { to: "/booking", label: "Букинг", icon: navBookingIcon },
  { to: "/events", label: "События", icon: navEventsIcon },
  { to: "/profile", label: "Профиль", icon: navProfileIcon },
] as const;

function buildNavItems(role: ApiUser["role"]) {
  if (role === "label") {
    return [
      baseNavItems[0],
      baseNavItems[1],
      baseNavItems[2],
      { to: "/proposals", label: "Предложения", icon: "proposals" as const },
      baseNavItems[5],
    ];
  }

  if (role !== "musician") {
    return baseNavItems;
  }

  return [
    baseNavItems[0],
    baseNavItems[1],
    baseNavItems[2],
    { to: "/proposals", label: "Предложения", icon: "proposals" as const },
    { to: "/roadmap/map", label: "Roadmap", icon: "roadmap" as const },
    baseNavItems[3],
    baseNavItems[4],
    baseNavItems[5],
  ];
}

export function AppSidebar(props: AppSidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const [unreadProposals, setUnreadProposals] = useState(0);
  const avatarSrc = resolveAvatarUrl(
    props.user.musicianProfile?.avatarUrl,
    defaultAvatar,
  );
  const level = getMusicianLevelFromUser(props.user);
  const navItems = buildNavItems(props.user.role);
  const isLabel = props.user.role === "label";

  useEffect(() => {
    void api
      .getProposalUnreadCount()
      .then((result) => setUnreadProposals(result.unreadCount))
      .catch(() => {
        /* optional badge */
      });
  }, [props.user.role, location.pathname]);

  return (
    <aside className="app-sidebar" aria-label="Навигация">
      <div className="app-brand">
        <span className="app-brand__mark">A</span>
        <span>MTC Artist</span>
      </div>

      <div className="app-sidebar__user">
        <img src={avatarSrc} alt="" />
        <span>{props.user.name}</span>
        {isLabel ? (
          <span className="app-sidebar__badge">Лейбл</span>
        ) : (
          <span className="app-sidebar__level" aria-label={`Уровень ${level}`}>
            <img src={levelFlagIcon} alt="" />
            <strong>{level}</strong>
          </span>
        )}
      </div>

      <nav className="app-sidebar__nav">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to === "/roadmap/map" && location.pathname.startsWith("/roadmap")) ||
            (item.to === "/proposals" && location.pathname.startsWith("/proposals"));

          return (
            <Link
              key={item.label}
              to={item.to}
              className={isActive ? "is-active" : undefined}
            >
              {item.icon === "bookmark" ? (
                <BookmarkIcon
                  className="app-sidebar__nav-icon app-sidebar__nav-icon--bookmark"
                  filled={isActive}
                  size={20}
                />
              ) : item.icon === "roadmap" ? (
                <RoadmapNavIcon active={isActive} />
              ) : item.icon === "proposals" ? (
                <ProposalsNavIcon active={isActive} />
              ) : (
                <img className="app-sidebar__nav-icon" src={item.icon} alt="" />
              )}
              <span>{item.label}</span>
              {item.icon === "proposals" && unreadProposals > 0 ? (
                <span className="app-sidebar__nav-badge">{unreadProposals}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <ProPanel compact />
      <button
        type="button"
        className="app-sidebar__logout"
        onClick={() => void logout()}
      >
        Выйти
      </button>
      <p className="app-sidebar__copyright">© Bobr LLC 2026</p>
    </aside>
  );
}

function RoadmapNavIcon(props: { active: boolean }) {
  return (
    <svg
      className="app-sidebar__nav-icon"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        d="M4 3h12v14H4V3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill={props.active ? "currentColor" : "none"}
        fillOpacity={props.active ? 0.18 : 0}
      />
      <path
        d="M7 7h6M7 10h6M7 13h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProposalsNavIcon(props: { active: boolean }) {
  return (
    <svg
      className="app-sidebar__nav-icon"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        d="M3 5.5h14v9H3v-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill={props.active ? "currentColor" : "none"}
        fillOpacity={props.active ? 0.18 : 0}
      />
      <path
        d="M3 6.5 10 11l7-4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
