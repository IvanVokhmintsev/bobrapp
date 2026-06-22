import {
  ROADMAP_CANVAS,
  roadmapLevelNodes,
  roadmapMilestones,
  roadmapPaths,
  roadmapToolbar,
} from "./roadmapLayout";
import { getLevelStatus, type RoadmapLevelStatus } from "../../lib/roadmapLevels";
import type { RoadmapStep } from "../../api";
import "./profile-roadmap.css";

type ProfileRoadmapMapProps = {
  selectedLevel?: number | null;
  compact?: boolean;
  steps?: RoadmapStep[];
  onSelectLevel: (level: number) => void;
};

export function ProfileRoadmapMap(props: ProfileRoadmapMapProps) {
  const scale = props.compact ? 390 / ROADMAP_CANVAS.width : 1;
  const steps = props.steps ?? [];

  function levelClassName(level: number) {
    const classes = ["profile-roadmap-figma__level"];

    if (props.selectedLevel === level) {
      classes.push("is-selected");
    }

    if (steps.length > 0) {
      const status = getLevelStatus(level, steps);
      classes.push(levelStatusClass(status));
    }

    return classes.join(" ");
  }

  return (
    <section
      className={`profile-roadmap-figma ${props.compact ? "profile-roadmap-figma--compact" : ""}`}
      aria-label="Roadmap"
    >
      {!props.compact ? (
        <div className="profile-roadmap-figma__toolbar">
          {roadmapToolbar.map((item) => (
            <button key={item.id} type="button" aria-label={item.id} tabIndex={-1}>
              <img
                src={item.src}
                alt=""
                style={{ width: item.width, height: item.height }}
              />
            </button>
          ))}
        </div>
      ) : null}

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

          {roadmapLevelNodes.map((node) => (
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
              onClick={() => props.onSelectLevel(node.level)}
              aria-label={`Открыть уровень ${node.level}`}
            >
              <img src={node.src} alt="" />
            </button>
          ))}
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
