import { BriefcaseBusiness, Mic2 } from "lucide-react";

import type { UserRole } from "../api";

type AuthRolePickerProps = {
  value: UserRole;
  onChange: (role: UserRole) => void;
};

const roleOptions: Array<{
  value: UserRole;
  title: string;
  description: string;
  icon: typeof Mic2;
}> = [
  {
    value: "musician",
    title: "Музыкант",
    description: "Соло или группа, roadmap и публикации",
    icon: Mic2,
  },
  {
    value: "label",
    title: "Лейбл",
    description: "Поиск артистов и оценка активности",
    icon: BriefcaseBusiness,
  },
];

export function AuthRolePicker(props: AuthRolePickerProps) {
  return (
    <div className="auth-role-picker" role="radiogroup" aria-label="Тип аккаунта">
      <span className="auth-role-picker__label" id="auth-role-picker-label">
        Тип аккаунта
      </span>
      <div className="auth-role-picker__options">
        {roleOptions.map((option) => {
          const isSelected = props.value === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-labelledby={`auth-role-${option.value}-title`}
              aria-describedby={`auth-role-${option.value}-desc`}
              className={`auth-role-picker__option ${isSelected ? "is-selected" : ""}`}
              onClick={() => props.onChange(option.value)}
            >
              <span className="auth-role-picker__icon" aria-hidden="true">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span className="auth-role-picker__copy">
                <strong id={`auth-role-${option.value}-title`}>{option.title}</strong>
                <span id={`auth-role-${option.value}-desc`}>{option.description}</span>
              </span>
              <span className="auth-role-picker__indicator" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
