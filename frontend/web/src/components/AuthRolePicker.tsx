import { useEffect, useRef, useState } from "react";

import type { UserRole } from "../api";

type AuthRolePickerProps = {
  value: UserRole;
  onChange: (role: UserRole) => void;
};

const roleOptions: Array<{
  value: UserRole;
  title: string;
  description: string;
}> = [
  {
    value: "musician",
    title: "Музыкант",
    description: "Соло или группа, roadmap и публикации",
  },
  {
    value: "label",
    title: "Лейбл",
    description: "Поиск артистов и оценка активности",
  },
];

export function AuthRolePicker(props: AuthRolePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected =
    roleOptions.find((option) => option.value === props.value) ?? roleOptions[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function chooseRole(role: UserRole) {
    props.onChange(role);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={`auth-field auth-role-dropdown ${open ? "is-open" : ""}`}
    >
      <span className="auth-role-dropdown__label">Тип аккаунта</span>
      <button
        type="button"
        className="auth-role-dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="auth-role-dropdown__value">{selected.title}</span>
        <span className="auth-role-dropdown__chevron" aria-hidden="true" />
      </button>

      {open ? (
        <div className="auth-role-dropdown__menu" role="listbox" aria-label="Тип аккаунта">
          {roleOptions.map((option) => {
            const isSelected = option.value === props.value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`auth-role-dropdown__option ${isSelected ? "is-selected" : ""}`}
                onClick={() => chooseRole(option.value)}
              >
                <strong>{option.title}</strong>
                <span>{option.description}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
