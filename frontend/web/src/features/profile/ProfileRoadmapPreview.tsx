import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api, type RoadmapLevel } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { getCurrentLevel } from "../../lib/roadmapLevels";
import { ProfileRoadmapMap } from "./ProfileRoadmapMap";
import "./profile-roadmap.css";

type ProfileRoadmapPreviewProps = {
  enabled: boolean;
};

export function ProfileRoadmapPreview(props: ProfileRoadmapPreviewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [levels, setLevels] = useState<RoadmapLevel[]>([]);
  const [loadError, setLoadError] = useState("");

  const roadmapProgress = user?.musicianProfile?.roadmapProgress ?? 0;
  const currentLevel = getCurrentLevel(levels);

  useEffect(() => {
    if (!props.enabled) {
      return;
    }

    void api
      .getRoadmap()
      .then((result) => {
        setLevels(result.levels);
        setLoadError("");
      })
      .catch((caught) => {
        setLevels([]);
        setLoadError(
          caught instanceof Error ? caught.message : "Не удалось загрузить карту roadmap",
        );
      });
  }, [props.enabled]);

  if (!props.enabled) {
    return null;
  }

  return (
    <section className="profile-roadmap-preview profile-section" aria-labelledby="profile-roadmap-title">
      <div className="profile-roadmap-preview__head">
        <div>
          <h2 id="profile-roadmap-title">Карта развития</h2>
          <p className="profile-roadmap-preview__meta">
            Прогресс: {roadmapProgress}%
            {currentLevel ? ` · текущий уровень: ${currentLevel.title}` : null}
          </p>
        </div>
        <Link className="profile-header-action profile-header-action--primary" to="/roadmap">
          Открыть roadmap
        </Link>
      </div>

      {loadError ? <p className="app-page__error">{loadError}</p> : null}

      {levels.length > 0 ? (
        <div className="profile-roadmap-preview__map">
          <ProfileRoadmapMap
            compact
            levels={levels}
            selectedLevelOrder={currentLevel?.order ?? null}
            onSelectLevel={(levelOrder) => navigate(`/roadmap?level=${levelOrder}`)}
          />
        </div>
      ) : null}
    </section>
  );
}
