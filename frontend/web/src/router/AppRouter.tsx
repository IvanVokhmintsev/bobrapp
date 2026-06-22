import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { AuthScreen } from "../features/auth/AuthScreen";
import { BookingScreen } from "../features/booking/BookingScreen";
import { EventsScreen } from "../features/events/EventsScreen";
import { FeedScreen } from "../features/feed/FeedScreen";
import { PeopleScreen } from "../features/people/PeopleScreen";
import { AppLayout } from "../features/layout/AppLayout";
import { AppLoading } from "../features/layout/AppLoading";
import "../features/layout/app-shell.css";
import { OnboardingScreen } from "../features/onboarding/OnboardingScreen";
import { RoadmapMapScreen } from "../features/roadmap/RoadmapMapScreen";
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
              <Route path="/people" element={<PeopleScreen />} />
              <Route path="/booking" element={<BookingScreen />} />
              <Route path="/events" element={<EventsScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/profile/:userId" element={<ProfileScreen />} />
              <Route path="/discover" element={<Navigate to="/people" replace />} />
              <Route path="/roadmap" element={<RoadmapScreen />} />
              <Route path="/roadmap/map" element={<RoadmapMapScreen />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
