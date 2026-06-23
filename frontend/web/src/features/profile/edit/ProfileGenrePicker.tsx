import { MUSIC_GENRES, normalizeGenres } from "../../../lib/musicGenres";

type ProfileGenrePickerProps = {
  value: string[];
  onChange: (genres: string[]) => void;
  label?: string;
};

export function ProfileGenrePicker(props: ProfileGenrePickerProps) {
  const selected = new Set(props.value.map((genre) => genre.toLowerCase()));

  function toggleGenre(genre: string) {
    const key = genre.toLowerCase();
    const next = selected.has(key)
      ? props.value.filter((item) => item.toLowerCase() !== key)
      : normalizeGenres([...props.value, genre]);

    props.onChange(next);
  }

  function addCustomGenre(rawValue: string) {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return;
    }

    props.onChange(normalizeGenres([...props.value, trimmed]));
  }

  return (
    <div className="profile-form-field">
      <span className="profile-form-field__label">{props.label ?? "Жанры"}</span>
      <div className="profile-genre-picker">
        <div className="profile-genre-picker__chips" role="group" aria-label="Жанры">
          {MUSIC_GENRES.map((genre) => {
            const isSelected = selected.has(genre.toLowerCase());

            return (
              <button
                key={genre}
                type="button"
                className={`profile-genre-chip ${isSelected ? "is-selected" : ""}`}
                aria-pressed={isSelected}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </button>
            );
          })}
        </div>
        <form
          className="profile-genre-picker__custom"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const input = form.elements.namedItem("customGenre") as HTMLInputElement;
            addCustomGenre(input.value);
            input.value = "";
          }}
        >
          <input
            name="customGenre"
            placeholder="Свой жанр"
            maxLength={60}
            aria-label="Добавить свой жанр"
          />
          <button type="submit">Добавить</button>
        </form>
        {props.value.length ? (
          <div className="profile-genre-picker__selected" aria-label="Выбранные жанры">
            {props.value.map((genre) => (
              <span className="profile-genre-picker__tag" key={genre}>
                {genre}
                <button
                  type="button"
                  aria-label={`Убрать жанр ${genre}`}
                  onClick={() => toggleGenre(genre)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="profile-form-field__hint">Выберите жанры из списка или добавьте свой</p>
        )}
      </div>
    </div>
  );
}
