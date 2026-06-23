import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type AuthPasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
};

export function AuthPasswordField(props: AuthPasswordFieldProps) {
  const [internalVisible, setInternalVisible] = useState(false);
  const visible = props.visible ?? internalVisible;

  function toggleVisible() {
    const nextVisible = !visible;
    if (props.onVisibleChange) {
      props.onVisibleChange(nextVisible);
      return;
    }

    setInternalVisible(nextVisible);
  }

  return (
    <label className="auth-field">
      <span>{props.label}</span>
      <div className="auth-password-field">
        <input
          type={visible ? "text" : "password"}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          placeholder={props.placeholder}
          autoComplete={props.autoComplete}
          required={props.required}
          minLength={props.minLength}
        />
        <button
          type="button"
          className="auth-password-field__toggle"
          aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={visible}
          onClick={toggleVisible}
        >
          {visible ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
        </button>
      </div>
    </label>
  );
}
