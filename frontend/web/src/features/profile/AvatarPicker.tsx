import { useRef, useState } from "react";

import { api, type ApiUser } from "../../api";
import defaultAvatar from "../../assets/feed/card-cover.png";
import { resolveAvatarUrl } from "../../lib/avatarUrl";

type AvatarPickerProps = {
  user: ApiUser;
  size?: "small" | "large";
  showActions?: boolean;
  onUpdated: (user: ApiUser) => void;
};

export function AvatarPicker(props: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const avatarSrc = resolveAvatarUrl(
    previewUrl ?? props.user.musicianProfile?.avatarUrl,
    defaultAvatar,
  );
  const hasCustomAvatar = Boolean(
    props.user.musicianProfile?.avatarUrl || previewUrl,
  );
  const isBusy = isUploading || isRemoving;

  async function uploadFile(file: File | null) {
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

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);
    setError("");

    try {
      const result = await api.uploadAvatar(file);
      props.onUpdated(result.user);
      setPreviewUrl(null);
      URL.revokeObjectURL(objectUrl);
    } catch (caught) {
      setPreviewUrl(null);
      URL.revokeObjectURL(objectUrl);
      setError(caught instanceof Error ? caught.message : "Не удалось загрузить аватар");
    } finally {
      setIsUploading(false);
    }
  }

  async function removeAvatar() {
    if (!hasCustomAvatar || isBusy) {
      return;
    }

    setIsRemoving(true);
    setError("");

    try {
      const result = await api.deleteAvatar();
      props.onUpdated(result.user);
      setPreviewUrl(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось удалить аватар");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div
      className={`avatar-picker avatar-picker--${props.size ?? "small"} ${
        props.showActions ? "avatar-picker--with-actions" : ""
      }`}
    >
      <button
        type="button"
        className="avatar-picker__trigger"
        onClick={() => inputRef.current?.click()}
        disabled={isBusy}
        aria-label="Изменить аватар"
      >
        <img className="avatar-picker__image" src={avatarSrc} alt="" />
        <span className="avatar-picker__overlay">
          {isBusy ? "..." : "Изменить"}
        </span>
      </button>

      {props.showActions ? (
        <div className="avatar-picker__actions">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
          >
            Загрузить фото
          </button>
          {hasCustomAvatar ? (
            <button type="button" onClick={() => void removeAvatar()} disabled={isBusy}>
              Удалить
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="avatar-picker__error">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          void uploadFile(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
