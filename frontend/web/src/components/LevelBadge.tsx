import levelFlagIcon from "../assets/profile/level-flag.svg";

import "./level-badge.css";

type LevelBadgeProps = {
  level: number;
  className?: string;
};

export function LevelBadge(props: LevelBadgeProps) {
  return (
    <span
      className={["level-badge", props.className].filter(Boolean).join(" ")}
      aria-label={`Уровень ${props.level}`}
    >
      <img src={levelFlagIcon} alt="" />
      <strong>{props.level}</strong>
    </span>
  );
}
