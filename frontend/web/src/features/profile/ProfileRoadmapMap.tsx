import { useMemo } from "react";

import { isLevelSelectable, type RoadmapLevelStatus } from "../../lib/roadmapLevels";
import type { RoadmapLevel } from "../../api";
import "./profile-roadmap.css";

type ProfileRoadmapMapProps = {
  levels: RoadmapLevel[];
  selectedLevelOrder?: number | null;
  compact?: boolean;
  onSelectLevel: (levelOrder: number) => void;
};

export function ProfileRoadmapMap(props: ProfileRoadmapMapProps) {
  const sortedLevels = useMemo(
    () => [...props.levels].sort((left, right) => left.order - right.order),
    [props.levels],
  );

  return (
    <section
      className={`roadmap-map ${props.compact ? "roadmap-map--compact" : ""}`}
      aria-label="Карта уровней roadmap"
    >
      <ol className="roadmap-map__track">
        {sortedLevels.map((level, index) => {
          const selectable = isLevelSelectable(level);
          const isSelected = props.selectedLevelOrder === level.order;

          return (
            <li className="roadmap-map__step" key={level.id}>
              {index > 0 ? (
                <RoadmapConnector tone={connectorTone(sortedLevels[index - 1]!)} />
              ) : null}

              <button
                type="button"
                className={[
                  "roadmap-map__node",
                  `roadmap-map__node--${level.status}`,
                  isSelected ? "is-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                disabled={!selectable}
                onClick={() => props.onSelectLevel(level.order)}
                aria-label={`Уровень ${level.order}: ${level.title}`}
                aria-current={level.status === "current" ? "step" : undefined}
              >
                <span className="roadmap-map__digit">{level.order}</span>
              </button>

              <p className="roadmap-map__title">{level.title}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function RoadmapConnector(props: { tone: RoadmapLevelStatus | "locked" }) {
  const stroke =
    props.tone === "completed"
      ? "var(--roadmap-line-completed)"
      : props.tone === "current"
        ? "var(--roadmap-line-current)"
        : "var(--roadmap-line-locked)";

  return (
    <svg
      className={`roadmap-map__connector roadmap-map__connector--${props.tone}`}
      viewBox="0 0 24 72"
      aria-hidden="true"
    >
      <line
        x1="12"
        y1="4"
        x2="12"
        y2="56"
        stroke={stroke}
        strokeWidth="2"
        strokeDasharray="5 7"
        strokeLinecap="round"
      />
      <path d="M12 68 L6 54 L18 54 Z" fill={stroke} />
    </svg>
  );
}

function connectorTone(level: RoadmapLevel): RoadmapLevelStatus | "locked" {
  if (level.status === "completed") {
    return "completed";
  }

  if (level.status === "current") {
    return "current";
  }

  return "locked";
}
