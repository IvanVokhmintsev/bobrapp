import { useState } from "react";

import type { ProfileBlockStatus } from "../../lib/profileCompleteness";
import "./profile-completeness.css";

type ProfileCompletenessProps = {
  blocks: ProfileBlockStatus[];
  showHints?: boolean;
};

export function ProfileCompleteness(props: ProfileCompletenessProps) {
  const filledCount = props.blocks.filter((block) => block.filled).length;
  const isComplete = filledCount === props.blocks.length;
  const [expanded, setExpanded] = useState(!isComplete);

  return (
    <section
      className={`profile-completeness ${expanded ? "is-expanded" : "is-collapsed"}`}
      aria-label="Заполненность профиля"
    >
      <button
        type="button"
        className="profile-completeness__toggle"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <h2>Заполненность профиля</h2>
        <span className="profile-completeness__summary">
          {filledCount} / {props.blocks.length}
          <span className="profile-completeness__chevron" aria-hidden="true">
            ▾
          </span>
        </span>
      </button>

      {expanded ? (
        <>
          <ul className="profile-completeness__list">
            {props.blocks.map((block) => (
              <li
                key={block.id}
                className={block.filled ? "is-filled" : "is-empty"}
              >
                <span className="profile-completeness__label">{block.label}</span>
                <span className="profile-completeness__status">
                  {block.filled ? "Заполнен" : "Не заполнен"}
                </span>
              </li>
            ))}
          </ul>
          {props.showHints && !isComplete ? (
            <p className="profile-completeness__hint">
              Заполните пустые блоки в редактировании профиля — так вас проще найти лейблам и
              площадкам.
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
