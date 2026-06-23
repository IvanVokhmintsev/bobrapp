import {
  ROADMAP_CANVAS,
  roadmapLevelNodes,
  roadmapMilestones,
  roadmapPaths,
} from "./roadmapLayout";
import {
  getLevelByMapNode,
  isLevelSelectable,
  type RoadmapLevelStatus,
} from "../../lib/roadmapLevels";
import type { RoadmapLevel } from "../../api";
import "./profile-roadmap.css";

type ProfileRoadmapMapProps = {
  levels: RoadmapLevel[];
  selectedLevel?: number | null;
  compact?: boolean;
  onSelectLevel: (mapNodeId: number) => void;
};

export function ProfileRoadmapMap(props: ProfileRoadmapMapProps) {
  const scale = props.compact ? 390 / ROADMAP_CANVAS.width : 1;

  function levelClassName(mapNodeId: number) {
    const classes = ["profile-roadmap-figma__level"];
    const level = getLevelByMapNode(props.levels, mapNodeId);

    if (props.selectedLevel === mapNodeId) {
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

          {roadmapMilestones.map((milestone) => (
            <div
              key={milestone.id}
              className="profile-roadmap-figma__milestone"
              style={{
                left: milestone.left,
                top: milestone.top,
                width: milestone.size,
                height: milestone.size,
              }}
            >
              <img className="profile-roadmap-figma__milestone-ring" src={milestone.ring} alt="" />
              {hasMilestoneIcon(milestone) ? (
                <img
                  className="profile-roadmap-figma__milestone-icon"
                  src={milestone.icon}
                  alt=""
                  style={{
                    left: milestone.iconLeft - milestone.left,
                    top: milestone.iconTop - milestone.top,
                    width: milestone.iconWidth,
                    height: milestone.iconHeight,
                  }}
                />
              ) : null}
              {"label" in milestone && milestone.label ? (
                <span className="profile-roadmap-figma__milestone-label">{milestone.label}</span>
              ) : null}
            </div>
          ))}

          {roadmapLevelNodes.map((node) => {
            const level = getLevelByMapNode(props.levels, node.level);
            const selectable = level ? isLevelSelectable(level) : false;

            return (
              <button
                type="button"
                key={node.level}
                className={levelClassName(node.level)}
                style={{
                  left: node.left,
                  top: node.top,
                  width: node.width,
                  height: node.height,
                }}
                disabled={!selectable}
                onClick={() => {
                  if (selectable) {
                    props.onSelectLevel(node.level);
                  }
                }}
                aria-label={`Уровень ${node.level}`}
              >
                <img src={node.src} alt="" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function hasMilestoneIcon(
  milestone: (typeof roadmapMilestones)[number],
): milestone is (typeof roadmapMilestones)[number] & {
  icon: string;
  iconLeft: number;
  iconTop: number;
  iconWidth: number;
  iconHeight: number;
} {
  return "icon" in milestone;
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
