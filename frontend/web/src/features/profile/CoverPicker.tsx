import { useEffect, useRef, useState } from "react";

import { resolveCoverUrl } from "../../lib/coverUrl";

type CoverPickerProps = {
  label: string;
  coverUrl: string;
  fallback: string;
  pendingFile: File | null;
  onCoverUrlChange: (value: string) => void;
  onPendingFileChange: (file: File | null) => void;
};

export function CoverPicker(props: CoverPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!props.pendingFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(props.pendingFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [props.pendingFile]);

  const imageSrc = previewUrl || resolveCoverUrl(props.coverUrl, props.fallback);

  function selectFile(file: File | null) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Выберите файл изображения");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Размер файла не должен превышать 5 МБ");
      return;
    }

    setError("");
    props.onPendingFileChange(file);
  }

  function clearPendingFile() {
    props.onPendingFileChange(null);
    setError("");
  }

  return (
    <div className="cover-picker">
      <span className="cover-picker__label">{props.label}</span>
      <div className="cover-picker__preview">
        <img src={imageSrc} alt="" />
      </div>
      <div className="cover-picker__actions">
        <button type="button" onClick={() => inputRef.current?.click()}>
          Загрузить фото
        </button>
        {props.pendingFile ? (
          <button type="button" onClick={clearPendingFile}>
            Отменить выбор
          </button>
        ) : null}
      </div>
      <label className="cover-picker__url">
        Или ссылка на изображение
        <input
          value={props.coverUrl}
          onChange={(event) => {
            props.onPendingFileChange(null);
            props.onCoverUrlChange(event.target.value);
          }}
          placeholder="https://..."
          disabled={Boolean(props.pendingFile)}
        />
      </label>
      {props.pendingFile ? (
        <p className="cover-picker__hint">Фото загрузится после сохранения</p>
      ) : null}
      {error ? <p className="cover-picker__error">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(event) => {
          selectFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
    </div>
  );
}
