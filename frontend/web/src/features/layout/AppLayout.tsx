import { Outlet } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { AppTabBar } from "../navigation/AppTabBar";
import { AppSidebar } from "./AppSidebar";
import "./app-shell.css";

export function AppLayout() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="app-shell-root">
      <div className="app-layout">
        <AppSidebar user={user} />
        <div className="app-layout__content">
          <Outlet />
        </div>
      </div>
      <AppTabBar />
      <button type="button" className="app-layout__logout" onClick={() => void logout()}>
        Выйти
      </button>
    </div>
  );
}
