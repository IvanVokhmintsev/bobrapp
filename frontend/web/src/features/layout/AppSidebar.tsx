import { Link, useLocation } from "react-router-dom";

import type { ApiUser } from "../../api";
import defaultAvatar from "../../assets/feed/card-cover.png";
import levelFlagIcon from "../../assets/profile/level-flag.svg";
import bookmarkIcon from "../../assets/feed/bookmark-action.png";
import navBookingIcon from "../../assets/profile/nav-booking.svg";
import navEventsIcon from "../../assets/profile/nav-events.svg";
import navFeedIcon from "../../assets/profile/nav-feed.svg";
import navMusiciansIcon from "../../assets/profile/nav-musicians.svg";
import navProfileIcon from "../../assets/profile/nav-profile.svg";
import { useAuth } from "../../context/AuthContext";
import { getMusicianLevelFromUser } from "../../lib/musicianLevel";
import { resolveAvatarUrl } from "../../lib/avatarUrl";
import { ProPanel } from "./ProPanel";

type AppSidebarProps = {
  user: ApiUser;
};

const navItems = [
  { to: "/feed", label: "Лента", icon: navFeedIcon },
  { to: "/people", label: "Музыканты", icon: navMusiciansIcon },
  { to: "/favorites", label: "Избранное", icon: bookmarkIcon },
  { to: "/booking", label: "Букинг", icon: navBookingIcon },
  { to: "/events", label: "События", icon: navEventsIcon },
  { to: "/profile", label: "Профиль", icon: navProfileIcon },
];

export function AppSidebar(props: AppSidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const avatarSrc = resolveAvatarUrl(
    props.user.musicianProfile?.avatarUrl,
    defaultAvatar,
  );
  const level = getMusicianLevelFromUser(props.user);

  return (
    <aside className="app-sidebar" aria-label="Навигация">
      <div className="app-brand">
        <span className="app-brand__mark">A</span>
        <span>MTC Artist</span>
      </div>

      <div className="app-sidebar__user">
        <img src={avatarSrc} alt="" />
        <span>{props.user.name}</span>
        <span className="app-sidebar__level" aria-label={`Уровень ${level}`}>
          <img src={levelFlagIcon} alt="" />
          <strong>{level}</strong>
        </span>
      </div>

      <nav className="app-sidebar__nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.label}
              to={item.to}
              className={isActive ? "is-active" : undefined}
            >
              <img className="app-sidebar__nav-icon" src={item.icon} alt="" />
              <span>{item.label}</span>
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
