import { ROADMAP_CANVAS, roadmapLevelNodes, roadmapPaths } from "./roadmapLayout";
import {
  getLevelByMapNode,
  isLevelSelectable,
  type RoadmapLevelStatus,
} from "../../lib/roadmapLevels";
import type { RoadmapLevel } from "../../api";
import "./profile-roadmap.css";

type ProfileRoadmapMapProps = {
  levels: RoadmapLevel[];
  /** Selected level order (1…n), not map node id. */
  selectedLevelOrder?: number | null;
  compact?: boolean;
  onSelectLevel: (levelOrder: number) => void;
};

export function ProfileRoadmapMap(props: ProfileRoadmapMapProps) {
  const scale = props.compact ? 390 / ROADMAP_CANVAS.width : 1;

  function levelClassName(level: RoadmapLevel | null, levelOrder: number | null) {
    const classes = ["profile-roadmap-figma__level"];

    if (levelOrder != null && props.selectedLevelOrder === levelOrder) {
      classes.push("is-selected");
    }

    if (level) {
      classes.push(levelStatusClass(level.status));
    }

    return classes.join(" ");
  }

  return (
    <section
      className={`profile-roadmap-figma ${props.compact ? "profile-roadmap-figma--compact" : ""}`}
      aria-label="Roadmap"
    >
      <div
        className="profile-roadmap-figma__viewport"
        style={{ height: ROADMAP_CANVAS.height * scale }}
      >
        <div
          className="profile-roadmap-figma__canvas"
          style={{
            width: ROADMAP_CANVAS.width,
            height: ROADMAP_CANVAS.height,
            transform: `translateX(-50%) scale(${scale})`,
          }}
        >
          {roadmapPaths.map((segment, index) => (
            <img
              key={`path-${index}`}
              className="profile-roadmap-figma__path"
              src={segment.src}
              alt=""
              style={{
                left: segment.left,
                top: segment.top,
                width: segment.width,
                height: segment.height,
              }}
            />
          ))}

          {roadmapLevelNodes.map((node) => {
            const level = getLevelByMapNode(props.levels, node.mapNodeId);
            const levelOrder = level?.order ?? null;
            const selectable = level ? isLevelSelectable(level) : false;

            return (
              <button
                type="button"
                key={node.mapNodeId}
                className={levelClassName(level, levelOrder)}
                style={{
                  left: node.left,
                  top: node.top,
                  width: node.width,
                  height: node.height,
                }}
                disabled={!selectable || levelOrder == null}
                onClick={() => {
                  if (selectable && levelOrder != null) {
                    props.onSelectLevel(levelOrder);
                  }
                }}
                aria-label={levelOrder != null ? `Уровень ${levelOrder}` : "Уровень"}
              >
                <img className="profile-roadmap-figma__level-art" src={node.src} alt="" />
                {levelOrder != null ? (
                  <span className="profile-roadmap-figma__level-digit" aria-hidden="true">
                    {levelOrder}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function levelStatusClass(status: RoadmapLevelStatus) {
  switch (status) {
    case "current":
      return "is-current";
    case "completed":
      return "is-completed";
    default:
      return "is-locked";
  }
}
