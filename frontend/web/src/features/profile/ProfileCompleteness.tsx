import type { ProfileBlockStatus } from "../../lib/profileCompleteness";
import "./profile-completeness.css";

type ProfileCompletenessProps = {
  blocks: ProfileBlockStatus[];
  showHints?: boolean;
};

export function ProfileCompleteness(props: ProfileCompletenessProps) {
  const filledCount = props.blocks.filter((block) => block.filled).length;

  return (
    <section className="profile-completeness" aria-label="Заполненность профиля">
      <header className="profile-completeness__header">
        <h2>Заполненность профиля</h2>
        <span>
          {filledCount} / {props.blocks.length}
        </span>
      </header>
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
      {props.showHints && filledCount < props.blocks.length ? (
        <p className="profile-completeness__hint">
          Заполните пустые блоки в редактировании профиля — так вас проще найти лейблам и
          площадкам.
        </p>
      ) : null}
    </section>
  );
}
