import { useAuth } from "../../context/AuthContext";
import { LabelOnboardingScreen } from "./LabelOnboardingScreen";
import { MusicianOnboardingScreen } from "./MusicianOnboardingScreen";

export function OnboardingScreen() {
  const { user } = useAuth();

  if (user?.role === "label") {
    return <LabelOnboardingScreen />;
  }

  return <MusicianOnboardingScreen />;
}
