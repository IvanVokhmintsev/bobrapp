import type { ReactNode } from "react";

type ProfileEditableTriggerProps = {
  children: ReactNode;
  label: string;
  onEdit: () => void;
  className?: string;
};

export function ProfileEditableTrigger(props: ProfileEditableTriggerProps) {
  return (
    <button
      type="button"
      className={`profile-editable-trigger ${props.className ?? ""}`.trim()}
      onClick={props.onEdit}
      aria-label={props.label}
    >
      {props.children}
      <span className="profile-editable-trigger__overlay" aria-hidden="true">
        <span className="profile-editable-trigger__icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path
              d="M4 20h4l10.5-10.5a1.4 1.4 0 0 0 0-2L16.5 5.5a1.4 1.4 0 0 0-2 0L4 16v4Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="m13.5 6.5 4 4" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
      </span>
    </button>
  );
}
