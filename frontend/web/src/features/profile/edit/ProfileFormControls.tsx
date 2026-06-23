type ProfileSegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; description?: string }>;
  onChange: (value: T) => void;
};

export function ProfileSegmentedControl<T extends string>(props: ProfileSegmentedControlProps<T>) {
  return (
    <div className="profile-form-field">
      <span className="profile-form-field__label">{props.label}</span>
      <div className="profile-segmented" role="radiogroup" aria-label={props.label}>
        {props.options.map((option) => {
          const isSelected = props.value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`profile-segmented__option ${isSelected ? "is-selected" : ""}`}
              onClick={() => props.onChange(option.value)}
            >
              <strong>{option.label}</strong>
              {option.description ? <span>{option.description}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type ProfileToggleProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ProfileToggle(props: ProfileToggleProps) {
  return (
    <label className="profile-toggle">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(event) => props.onChange(event.target.checked)}
      />
      <span className="profile-toggle__track" aria-hidden="true">
        <span className="profile-toggle__thumb" />
      </span>
      <span className="profile-toggle__label">{props.label}</span>
    </label>
  );
}
