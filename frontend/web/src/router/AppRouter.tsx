import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { AuthScreen } from "../features/auth/AuthScreen";
import { DiscoverScreen } from "../features/discover/DiscoverScreen";
import { FeedScreen } from "../features/feed/FeedScreen";
import { AppLayout } from "../features/layout/AppLayout";
import { AppLoading } from "../features/layout/AppLoading";
import "../features/layout/app-shell.css";
import { OnboardingScreen } from "../features/onboarding/OnboardingScreen";
import { ProfileScreen } from "../features/profile/ProfileScreen";
import { RoadmapScreen } from "../features/roadmap/RoadmapScreen";

function GuestRoute() {
  const { user, isBootstrapping, needsOnboarding } = useAuth();

  if (isBootstrapping) {
    return <AppLoading />;
  }

  if (user) {
    return <Navigate to={needsOnboarding ? "/onboarding" : "/feed"} replace />;
  }

  return <Outlet />;
}

function ProtectedRoute() {
  const { user, isBootstrapping, needsOnboarding } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <AppLoading />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (!needsOnboarding && location.pathname === "/onboarding") {
    return <Navigate to="/feed" replace />;
  }

  return <Outlet />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<AuthScreen />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route element={<AppLayout />}>
              <Route path="/feed" element={<FeedScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/discover" element={<DiscoverScreen />} />
              <Route path="/roadmap" element={<RoadmapScreen />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
